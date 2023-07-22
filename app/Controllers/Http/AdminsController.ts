import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import User from 'App/Models/User'
import Tracker from 'App/Models/Tracker'
import Sale from 'App/Models/Sale'
import Log, { LogActions } from 'App/Models/Log'
import Renewal from 'App/Models/Renewal'
import { googleFormsConfigs } from 'Config/googleForms'
export default class AdminsController {

    public async indexUsers({ request }: HttpContextContract) {
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

        const users = await User.query().if(role, (query) => {
            query.where('role', role)
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
                user_id = "0"
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
        const { title, reseller_id, sold_at, imeis, province, city } = request.all()
        let trackers = await Tracker.query().whereIn('imei', imeis)
        const imeisList = Array()
        let model = ''
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

        const sale = new Sale()
        sale.title = title
        sale.resellerId = reseller_id
        sale.soldAt = sold_at
        sale.imeis = JSON.stringify(imeisList)
        sale.province = province
        sale.city = city
        sale.trackersCount = imeisList.length
        sale.trackersModel = model
        sale.weight = imeisList.length * 320
        sale.boxCode = Math.floor(Math.random() * 1000000000).toString()
        sale.weight = imeisList.length * 320
        await sale.save()

        for (const tracker of trackers) {
            tracker.resellerId = reseller_id
            tracker.soldToResellerAt = sold_at
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

        const storedSale = await Sale.findOrFail(sale.id)
        storedSale.load('reseller')
        return {
            sale: storedSale
        }
    }

    public async indexSales({ request }: HttpContextContract) {
        const { box_code, reseller_id } = request.all()
        const sales = await Sale.query()
            .if(box_code != '', (query) => {
                query.where('box_code', box_code)
            }).if(reseller_id != '0', (query) => {
                query.where('reseller_id', reseller_id)
            }).preload('reseller').orderBy('created_at', 'desc').limit(50)

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
        for (const tracker of user.trackers) {
            imeis.push(tracker.imei)
        }

        for (const fc of googleFormsConfigs) {
            const form = {
                id: fc.id,
                code: fc.code,
                title: fc.title,
                url: '',
                sheet_link: fc.sheetLink
            }
            const url = `https://docs.google.com/forms/d/e/${fc.id}/viewform?usp=pp_url&entry.${fc.prefilledKeys.supportStaffId}=${admin.id}&entry.${fc.prefilledKeys.supportStaffEmail}=${admin.email}&entry.${fc.prefilledKeys.supportStaffName}=${admin.name}&entry.${fc.prefilledKeys.userId}=${user.id}&entry.${fc.prefilledKeys.phonenumber}=${user.phoneNumber.substring(1)}&entry.${fc.prefilledKeys.name}=${user.name}&entry.${fc.prefilledKeys.imeis}=${imeis.join('%0A')}&embedded=true`
            form.url = url
        }

        return {
            forms: forms
        }
    }
}

