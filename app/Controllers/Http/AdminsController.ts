import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import User from 'App/Models/User'
import Tracker from 'App/Models/Tracker'
export default class AdminsController {

    public async indexUsers({ request }: HttpContextContract) {
        const { role, phone_number, email, name } = request.all()
        const users = await User.query().if(role, (query) => {
            query.where('role', role)
        }).if(phone_number, (query) => {
            query.where('phone_number', phone_number)
        }).if(email, (query) => {
            query.where('email', 'like', `%${email}%`)
        }).if(name, (query) => {
            query.where('name', 'like', `%${name}%`)
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
            user: user
        }
    }

    public async indexTrackers({ request }: HttpContextContract) {
        const { user_id, status, model, imei, simcard_number } = request.all()
        const trackers = await Tracker.query()
            .if(user_id, (query) => {
                query.where('user_id', user_id)
            }).if(status, (query) => {
                query.where('status', status)
            }).if(model, (query) => {
                query.where('model', model)
            }).if(imei != '0', (query) => {
                query.where('imei', imei)
            }).if(simcard_number, (query) => {
                query.where('simcard_number', simcard_number)
            }).
            preload('user').orderBy('created_at', 'desc').limit(50)

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
        tracker.merge(request.only(['model', 'reseller_id', 'installer_id', 'warranty_expires_at', 'sold_to_reseller_at', 'status', 'supported_features']))
        await tracker.save()
        return {
            success: true
        }
    }

    public async destroyTracker({ request }: HttpContextContract) {
        const tracker = await Tracker.findOrFail(request.input('imei'))
        await tracker.delete()
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
            }
        }
        return {
            exists: exists,
            failed: failed,
            stored: stored
        }
    }



}
