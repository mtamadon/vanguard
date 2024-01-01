import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import User from 'App/Models/User'
import Tracker from 'App/Models/Tracker'
import Sale from 'App/Models/Sale'
import Log, { LogActions } from 'App/Models/Log'
import Renewal from 'App/Models/Renewal'
import { googleFormsConfigs } from 'Config/googleForms'
import UserSession from 'App/Models/UserSession'
import { DateTime } from 'luxon'
import FCMDevice from 'App/Models/FCMDevice'
import AfterSale from 'App/Models/AfterSale'
import { HttpContext } from '@adonisjs/core/build/standalone'
export default class AdminsController {
    public async indexUsers({ request, userRole }: HttpContextContract) {
        let { role, phone_number, email, imei, user_id } = request.all()

        if (imei) {
            const tracker = await Tracker.findBy('imei', imei)
            console.log(tracker?.userId);

            if (tracker && tracker.userId) {
                user_id = tracker.userId
            } else {
                user_id = "-1"
            }
        }
        const users = await User.query().if(userRole, (query) => {
            if (userRole == '12') {
                query.where('role', 1) // 1 is for normal users
            } else if (role) {
                query.where('role', role)
            }
        }).if(phone_number, (query) => {
            query.where('phone_number', "+" + phone_number)
        }).if(email, (query) => {
            query.where('email', 'like', `%${email}%`)
        }).if(user_id != "0", (query) => {
            query.where('id', user_id)
        }).preload('trackers').orderBy('id', 'desc').limit(50)
        return {
            users: users
        }
    }

    public async showUser({ request }: HttpContextContract) {
        const user = await User.findOrFail(request.input('id'))
        return {
            user: user
        }
    }

    public async updateUser({ request, response }: HttpContextContract) {
        const user = await User.findOrFail(request.input('id'))
        if (request.input('role') == 11) {
            // is not allowed to change role to admin
            return response.status(400).json({
                success: false,
                message: "You are not allowed to change role to admin"
            })
        }
        user.merge(request.only(['name', 'email', 'phone_number', 'role', 'avatar', 'city', 'language', 'country', 'status']))
        await user.save()
        return {
            success: true
        }
    }

    public async indexTrackers({ request }: HttpContextContract) {
        let { model, imei, user_phone_number, user_id } = request.all()

        if (user_phone_number != '') {
            const user = await User.findBy('phone_number', "+" + user_phone_number)
            if (user) {
                user_id = user.id
            } else {
                const tracker = await Tracker.findBy('simcard_number', "+" + user_phone_number)
                if (tracker && tracker.userId) {
                    imei = tracker.imei
                } else {
                    user_id = "-1"
                }
            }
        }

        const trackers = await Tracker.query()
            .if(user_id != "0", (query) => {
                query.where('user_id', user_id)
            })
            .if(model, (query) => {
                query.where('model', model)
            })
            .if(imei != '0', (query) => {
                query.where('imei', imei)
            })
            .preload('user').orderByRaw('first_assigned_at desc nulls last').limit(50)

        return {
            trackers: trackers
        }
    }

    public async showTracker({ request }: HttpContextContract) {
        const tracker = await Tracker.findOrFail(request.input('imei'))
        return {
            tracker: tracker
        }
    }

    public async updateTracker({ request }: HttpContextContract) {
        const tracker = await Tracker.findOrFail(request.input('imei'))
        tracker.merge(request.only(['model', 'warranty_expires_at', 'status', 'supported_features']))
        await tracker.save()
        return {
            success: true
        }
    }

    public async destroyTracker({ request }: HttpContextContract) {
        const tracker = await Tracker.findOrFail(request.input('imei'))
        await tracker.delete()
        await Tracker.postUnassignTracker(tracker.imei)
        await Log.log(LogActions.TrackerDelete, "ردیاب حذف شد", tracker.imei, JSON.parse(JSON.stringify(tracker)))
        return {
            success: true
        }
    }

    public async unassignTracker({ request, response }: HttpContextContract) {
        const tracker = await Tracker.findOrFail(request.input('imei'))
        if (!tracker.userId) {

            return response.badRequest({
                message: "این ردیاب به کاربری اختصاص داده نشده است"
            })
        }

        tracker.userId = null
        await tracker.save()
        await Tracker.postUnassignTracker(tracker.imei)
        await Log.log(LogActions.TrackerUnassignByAdmin, "ردیاب از کاربر توسط ادمین حذف شد", tracker.imei)

        return {
            success: true
        }
    }

    public async storeTracker({ request }: HttpContextContract) {
        const { imeis, model, supported_features } = request.all()
        const exists = new Array()
        const failed = new Array()
        const stored = new Array()
        for (const imei of imeis) {
            const tracker = await Tracker.findBy('imei', imei)
            if (tracker) {
                exists.push(imei)
            } else {
                const tracker = new Tracker()
                tracker.imei = imei
                tracker.supportedFeatures = supported_features
                tracker.status = 1
                tracker.model = model
                try {
                    await tracker.save()
                    stored.push(imei)
                } catch (e) {
                    failed.push(imei)
                }
                Log.log(LogActions.TrackerCreate, "ردیاب ایجاد شد", imei).catch(console.error);
            }
        }
        return {
            exists: exists,
            failed: failed,
            stored: stored
        }
    }

    public async destroyUser({ request }: HttpContextContract) {
        const user = await User.findOrFail(request.input('id'))
        await user.delete()
        for (const tracker of user.trackers) {
            tracker.userId = null
            await tracker.save()
        }

        return {
            success: true
        }
    }

    public async resetTracker({ request }: HttpContextContract) {
        const tracker = await Tracker.findOrFail(request.input('imei'))
        tracker.title = null
        tracker.driverName = null
        tracker.avatar = null
        tracker.userId = null
        tracker.installerId = null
        tracker.simcardNumber = null
        tracker.firstAssignedAt = null
        tracker.firstConnectedAt = null
        tracker.expiresAt = null
        tracker.WarrantyExpiresAt = null
        await tracker.save()

        await Tracker.postUnassignTracker(tracker.imei)

        await Log.log(LogActions.TrackerReset, "ردیاب صفر شد", tracker.imei)
        return {
            success: true
        }
    }

    public async preCheckSales({ request }: HttpContextContract) {
        const imeis = request.input('imeis')
        const free = new Array()
        const sold = new Array()
        const not_found = new Array()
        let weight = 0
        let model = ''
        let trackers = await Tracker.query().whereIn('imei', imeis)
        for (const imei of imeis) {
            const tracker = trackers.find((tracker) => tracker.imei == imei)
            if (tracker) {
                model = tracker.model
                if (tracker.resellerId == null) {
                    free.push(imei)
                    weight += 320
                } else {
                    sold.push(imei)
                }
            } else {
                not_found.push(imei)
            }
        }
        return {
            free: free,
            sold: sold,
            not_found: not_found,
            weight: weight,
            model: model
        }
    }

    public async storeSale({ request, response }: HttpContextContract) {
        const { title, reseller_id, sold_at, imeis, province, city, model_on_label } = request.all()
        let trackers = await Tracker.query().whereIn('imei', imeis)
        let model = ''
        const imeisList = new Array()
        for (const imei of imeis) {
            const tracker = trackers.find((tracker) => tracker.imei == imei)
            if (tracker) {
                if (tracker.resellerId == null) {
                    imeisList.push(imei)
                    model = tracker.model
                } else {
                    return response.status(400).json({ message: 'ردیاب قبلا فروخته شده' })
                }
            } else {
                return response.status(400).json({ message: 'ردیاب یافت نشد' })
            }
        }

        // move each 10 imeis an array
        const imeisChunks = new Array()
        for (let i = 0; i < imeisList.length; i += 10) {
            imeisChunks.push(imeisList.slice(i, i + 10))
        }


        let sale
        for (const imeisChunk of imeisChunks) {
            sale = await this.storeOneSale({ title, reseller_id, sold_at, province, city, model_on_label, model, imeis: imeisChunk })
        }

        const storedSale = await Sale.findOrFail(sale.id)
        storedSale.load('reseller')

        return {
            sale: storedSale
        }
    }


    private async storeOneSale(data: { title: string, reseller_id: number, sold_at: any, province: string, city: string, model_on_label: string, model: string, imeis: string[] }) {
        const { title, reseller_id, sold_at, province, city, model_on_label, model, imeis } = data
        const sale = new Sale()
        sale.title = title
        sale.resellerId = reseller_id
        sale.soldAt = sold_at
        sale.imeis = JSON.stringify(imeis)
        sale.province = province
        sale.city = city
        sale.trackersCount = imeis.length
        sale.trackersModel = model
        if (!model_on_label || model_on_label == '') {
            sale.modelOnLabel = model
        } else {
            sale.modelOnLabel = model_on_label
        }
        sale.weight = imeis.length * 320
        sale.boxCode = Math.floor(Math.random() * 1000000000).toString()
        sale.weight = imeis.length * 320
        await sale.save()

        for (const imei of imeis) {
            const tracker = await Tracker.findByOrFail('imei', imei)
            tracker.resellerId = reseller_id
            tracker.soldToResellerAt = sold_at
            tracker.saleId = sale.id
            await tracker.save()

            Log.log(LogActions.TrackerSold, "ردیاب فروخته شد", tracker.imei, {
                reseller_id: reseller_id,
                sold_at: sold_at,
                box_code: sale.boxCode,
                sale_id: sale.id,
                sale_created_at: sale.createdAt,
                sale_title: sale.title,
            }).catch(console.error);
        }
        return sale
    }

    public async indexSales({ request }: HttpContextContract) {
        const { box_code, reseller_id } = request.all()
        const sales = await Sale.query()
            .if(box_code != '', (query) => {
                query.where('box_code', box_code)
            }).if(reseller_id != '0', (query) => {
                query.where('reseller_id', reseller_id)
            }).preload('reseller').orderBy('created_at', 'desc').limit(50)

        for (const i in sales) {
            const sale = sales[i]
            if (sale.modelOnLabel == '' || sale.modelOnLabel == null) {
                sale.modelOnLabel = sale.trackersModel
                await sale.save()
            }
            sales[i] = sale
        }
        return {
            sales: sales
        }
    }

    public async destroySale({ request }: HttpContextContract) {
        const sale = await Sale.findOrFail(request.input('sale_id'))
        await sale.delete()
        for (const imei of sale.imeis) {
            const tracker = await Tracker.findBy('imei', imei)
            if (!tracker) {
                continue
            }
            tracker.resellerId = null
            tracker.soldToResellerAt = null
            tracker.saleId = null
            await tracker.save()
            Log.log(LogActions.TrackerUnsold, "ردیاب از فروش خارج شد", tracker.imei, {
                reseller_id: sale.resellerId,
                sold_at: sale.soldAt,
                box_code: sale.boxCode,
                sale_id: sale.id,
                sale_created_at: sale.createdAt,
                sale_title: sale.title,
            }).catch(console.error);
        }
        return {
            success: true
        }
    }

    public async renewTracker({ request, response, userId }: HttpContextContract) {
        const { imei, reference, paid_at } = request.all()
        const tracker = await Tracker.findByOrFail('imei', imei)
        if (tracker.expiresAt == null || tracker.userId == null) {
            return response.status(400).json({ message: 'ردیاب فعال نیست' })
        }

        const renewal = new Renewal()
        renewal.imeis = JSON.stringify([imei])
        renewal.trackersCount = 1
        renewal.package = 'basic-yearly'
        renewal.amount = 100000
        renewal.totalAmount = 100000
        renewal.userId = tracker.userId
        renewal.adminId = userId
        renewal.resellerId = tracker.resellerId
        await renewal.save()

        await renewal.markAsPaid(paid_at, reference)
        renewal.imeis = JSON.parse(renewal.imeis)
        return {
            renewal: renewal
        }
    }

    public async indexTrackerLogs({ request }: HttpContextContract) {
        const { imei } = request.all()
        const logs = await Log.query().where('tracker_imei', imei).orderBy('id', 'desc')
        return {
            logs: logs
        }
    }

    public async listUserRenewals({ request }: HttpContextContract) {
        const { user_id } = request.all()
        const renewals = await Renewal.query().where('user_id', user_id).orderBy('id', 'desc')
        return {
            renewals: renewals
        }
    }

    public async indexUserGoogleForms({ request, userId }: HttpContextContract) {
        const { user_id } = request.all()
        const user = await User.findOrFail(user_id)
        const admin = await User.findOrFail(userId)
        const forms = new Array()
        let imeis = new Array()
        let trackers = await Tracker.query().where('user_id', user_id)
        for (const tracker of trackers) {
            imeis.push(tracker.imei)
        }

        for (const fc of googleFormsConfigs) {
            const form = {
                id: fc.id,
                code: fc.code,
                title: fc.title,
                url: `https://docs.google.com/forms/d/e/${fc.id}/viewform?usp=pp_url`,
                sheet_link: fc.sheetLink
            }
            if (fc.prefilledKeys.userId) {
                form.url += `&${fc.prefilledKeys.userId}=${user.id}`
            }
            if (fc.prefilledKeys.name) {
                form.url += `&${fc.prefilledKeys.name}=${user.name}`
            }
            if (fc.prefilledKeys.phonenumber) {
                form.url += `&${fc.prefilledKeys.phonenumber}=${user.phoneNumber.substring(1)}`
            }
            if (fc.prefilledKeys.imeis) {
                form.url += `&${fc.prefilledKeys.imei}=${imeis.join("%0A")}`
            }
            if (fc.prefilledKeys.supportStaffEmail) {
                form.url += `&${fc.prefilledKeys.supportStaffEmail}=${admin.email}`
            }
            if (fc.prefilledKeys.supportStaffName) {
                form.url += `&${fc.prefilledKeys.supportStaffName}=${admin.name}`
            }
            if (fc.prefilledKeys.supportStaffId) {
                form.url += `&${fc.prefilledKeys.supportStaffId}=${admin.id}`
            }

            // iframe
            form.url += `&embedded=true`

            forms.push(form)
        }

        return {
            forms: forms
        }
    }

    public async indexUserSessions({ request }: HttpContextContract) {
        const { user_id } = request.all()
        const sessions = await UserSession.query().where('user_id', user_id).andWhereNot('service_id', 'LIKE', 'login-as-user:%').limit(50).orderBy('last_accessed_at', 'desc')
        for (const session of sessions) {
            session.token = ""
        }
        return {
            user_sessions: sessions
        }
    }

    public async destroyUserSessions({ request, userId }: HttpContextContract) {
        const { session_ids } = request.all()

        const adminUser = await User.findOrFail(userId)

        for (const id of session_ids) {
            try {
                const userSession = await UserSession.findOrFail(id)

                userSession.expiresAt = DateTime.now()
                await userSession.save()
                await FCMDevice.query().where('user_session_id', userSession.id).delete()
            } catch (e) {
                console.log(e)
            }
        }

        Log.log(LogActions.UserSessionDelete, "نشست های کاربر حذف شد", null, {
            user_id: adminUser.id,
            session_ids: session_ids
        })

        return {
            success: true
        }
    }
    public async indexAfterSales({ request }: HttpContextContract) {
        const { user_phone_number, imei, created_at } = request.all()

        let create_date: Date

        if (created_at) {
            create_date = new Date(created_at)
        }

        if (user_phone_number != '') {
            const user = await User.findBy('phone_number', "+" + user_phone_number)
            let userAfterSales: AfterSale[] = []

            if (user) {
                let user_id = user.id
                userAfterSales = await AfterSale.query().where('user_id', user_id)
                    .if(imei != "0", (query) => {
                        query.where('imei', imei)
                    })
                    .if(created_at, (query) => {
                        query.where('created_at ', '>=', create_date.toISOString())

                        create_date.setDate(create_date.getDate() + 1)
                        query.where('created_at', '<=', create_date.toISOString())
                    })


            }
            for (const aftersale of userAfterSales) {
                aftersale.statusTransitions = JSON.parse(JSON.stringify(aftersale.statusTransitions))
            }
            return {
                after_sales: userAfterSales
            }
        }

        const aftersales = await AfterSale.query()
            .if(imei != "0", (query) => {
                query.where('imei', imei)
            }).if(created_at, (query) => {
                query.where('created_at ', '>=', create_date.toISOString())

                create_date.setDate(create_date.getDate() + 1)
                query.where('created_at', '<=', create_date.toISOString())
            }).orderByRaw('created_at desc').limit(50)

        for (const aftersale of aftersales) {
            aftersale.statusTransitions = JSON.parse(JSON.stringify(aftersale.statusTransitions))
        }

        return {
            after_sales: aftersales
        }
    }

    public async storeAfterSales({ request, response }: HttpContextContract) {
        const { imei, note, status } = request.all()

        const tracker = await Tracker.findOrFail(imei)
        if (!tracker.userId) {
            return response.badRequest({
                message: "این ردیاب به کاربری اختصاص داده نشده است"
            })
        }
        let aftersale = await AfterSale.findBy('imei', imei)
        if (aftersale) {
            return response.badRequest({
                message: "یک خدمات پس از فروش با این سریال ردیاب از قبل وجود دارد"
            })
        }
        aftersale = new AfterSale()
        aftersale.userId = tracker.userId
        aftersale.imei = imei
        aftersale.note = note
        aftersale.status = status

        const transition = {
            last_status: "",
            new_status: aftersale.status,
            timestamp: DateTime.now()
        }
        let status_transitions = new Array()
        status_transitions.push(transition)
        aftersale.statusTransitions = JSON.stringify(status_transitions)
        await aftersale.save()

        aftersale.statusTransitions = status_transitions
        Log.log(LogActions.AfterSaleCreate, "خدمات پس از فروش اضافه شد", null, {
            aftersale_id: aftersale.id,
            aftersale_userid: aftersale.userId,
            aftersale_imei: aftersale.imei
        })

        return {
            after_sales: aftersale
        }
    }

    public async updateAfterSales({ request, response }: HttpContextContract) {

        if (request.input('new_imei')) {
            const tracker = Tracker.findBy('imei', request.input('new_imei'))
            if (!tracker) {
                return response.badRequest({
                    message: "ردیابی با این شماره سریال در سامانه وجود ندارد"
                })
            }
        }

        const afterSale = await AfterSale.findOrFail(request.input('aftersale_id'))
        let lastStatus = afterSale.status
        let newStatus = request.input('status')
        if (newStatus) {
            const new_transition = {
                last_status: lastStatus,
                new_status: newStatus,
                timestamp: DateTime.now()
            }
            let status_transitions = JSON.parse(JSON.stringify(afterSale.statusTransitions))
            status_transitions.push(new_transition)
            afterSale.statusTransitions = JSON.stringify(status_transitions)
        }

        afterSale.merge(request.only(['status', 'note', 'new_imei']))
        await afterSale.save()

        let updateLog = {
            aftersale_id: afterSale.id,
            aftersale_note: afterSale.note
        }
        if (newStatus) {
            updateLog['lastStaus'] = lastStatus
            updateLog['newStatus'] = newStatus
        }
        if (request.input('new_imei')) {
            updateLog['new_imei'] = afterSale.newImei
        }
        Log.log(LogActions.AfterSaleUpdate, "خدمات پس از فروش بروزرسانی شد", null, updateLog)

        return {
            success: true
        }
    }

    public async destroyAfterSales({ request }: HttpContextContract) {
        const afterSale = await AfterSale.findOrFail(request.input('aftersale_id'))

        await afterSale.delete()

        Log.log(LogActions.AfterSaleDelete, "خدمات پس از فروش حذف شد", null, JSON.stringify(afterSale))

        return {
            success: true
        }
    }

}

