import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import User from 'App/Models/User'
import Tracker from 'App/Models/Tracker'
import Sale from 'App/Models/Sale'
import Log, { LogActions } from 'App/Models/Log'
export default class AdminsController {

    public async indexUsers({ request }: HttpContextContract) {
        let { role, phone_number, email, imei, user_id } = request.all()

        if (imei) {
            const tracker = await Tracker.findBy('imei', imei)
            user_id = tracker?.userId
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

    public async updateUser({ request }: HttpContextContract) {
        const user = await User.findOrFail(request.input('id'))
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
            .preload('user').orderBy('created_at', 'desc').limit(50)

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

    public async unassignTracker({ request }: HttpContextContract) {
        const tracker = await Tracker.findOrFail(request.input('imei'))
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
        tracker.ExpiresAt = null
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
                if (tracker.resellerID == null) {
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
                if (tracker.resellerID == null) {
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
            tracker.resellerID = reseller_id
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
            tracker.resellerID = null
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
}
