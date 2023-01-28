import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Renewal from 'App/Models/Renewal'

import Tracker from "App/Models/Tracker"
import { DateTime } from 'luxon'

export default class TrackersController {
    public async index({ response, userId }: HttpContextContract) {
        const trackers = await Tracker.query().where('user_id', userId)
        console.log(JSON.stringify(trackers))
        return response.json({
            trackers: trackers
        })
    }

    public async unassign({ request, response, userId }: HttpContextContract) {
        const imei = request.input('imei')
        const tracker = await Tracker.find(imei)
        if (!tracker) {
            return response.status(404).json({ message: 'ردیاب یافت نشد.' })
        }
        if (tracker.userId != userId) {
            return response.status(400).json({ message: 'این ردیاب متعلق به شما نمی باشد.' })
        }
        tracker.userId = null
        await tracker.save()
        await Tracker.postUnassignTracker(tracker.imei)
        return response.json({ success: true })
    }

    public async preassign({ request, response, userId }: HttpContextContract) {
        const imei = request.input('imei')
        const tracker = await Tracker.find(imei)
        if (!tracker) {
            return response.status(404).json({ message: 'ردیاب یافت نشد.' })
        }
        console.log("IMEI: " + imei)
        console.log(tracker)
        if (tracker.userId == userId) {
            return response.status(400).json({ message: 'این ردیاب متعلق به شما می باشد.' })
        }
        if (tracker.userId != null) {
            return response.status(400).json({ message: 'این ردیاب قبلا به شخص دیگری تخصیص داده شده است.' })
        }
        return response.json({
            available: true,
            model: tracker.model,
            supported_features: tracker.supportedFeatures,
        })
    }

    public async assign({ request, response, userId }: HttpContextContract) {
        const { imei, title, driver_name, usage, fuel_usage, simcard_number } = request.all()
        console.log(imei)
        const tracker = await Tracker.find(imei)
        if (!tracker) {
            return response.status(400).json({ message: 'ردیاب مورد نظر در سامانه ثبت نشده است. درصورت نیاز با پشتیبانی تماس حاصل فرمایید.' })
        }
        if (tracker.userId != null) {
            if (tracker.userId == userId) {
                return response.status(400).json({ message: 'این ردیاب قبلا به شما تخصیص داده شده است.' })
            }
            return response.status(400).json({ message: 'ردیاب مورد نظر متعلق به کاربر دیگری است.' })
        }
        tracker.userId = userId
        tracker.title = title
        tracker.driverName = driver_name
        tracker.usage = usage
        if (tracker.supportedFeatures.driver_name) {
            tracker.driverName = driver_name
        }
        if (tracker.supportedFeatures.fuel_usage) {
            tracker.fuelUsage = fuel_usage
        }
        tracker.simcardNumber = simcard_number

        if (tracker.firstAssignedAt == null) {
            tracker.firstAssignedAt = DateTime.now()
            let expiresAt = new Date()
            expiresAt.setDate(expiresAt.getDate() + 365)
            tracker.expiresAt = DateTime.fromJSDate(expiresAt)
            tracker.WarrantyExpiresAt = DateTime.fromJSDate(expiresAt)
        }
        await tracker.save()
        return response.json({ success: true })
    }

    public async update({ request, response, userId }: HttpContextContract) {
        const { imei, title, driver_name, usage, fuel_usage, simcard_number } = request.all()
        const tracker = await Tracker.find(imei)
        if (!tracker) {
            return response.status(400).json({ message: 'ردیاب مورد نظر در سامانه ثبت نشده است. درصورت نیاز با پشتیبانی تماس حاصل فرمایید.' })
        }
        if (tracker.userId != userId) {
            return response.status(400).json({ message: 'ردیاب مورد نظر متعلق به شما نمی باشد.' })
        }
        tracker.title = title
        tracker.usage = usage
        if (tracker.supportedFeatures.driver_name) {
            tracker.driverName = driver_name
        }
        if (tracker.supportedFeatures.fuel_usage) {
            tracker.fuelUsage = fuel_usage
        }
        tracker.simcardNumber = simcard_number
        await tracker.save()
        return response.json({ success: true })
    }

    public async show({ request, response, userId }: HttpContextContract) {
        const imei = request.input('imei')
        const tracker = await Tracker.find(imei)
        if (!tracker) {
            return response.status(404).json({ message: 'ردیاب یافت نشد.' })
        }
        if (tracker.userId != userId) {
            return response.status(400).json({ message: 'این ردیاب متعلق به شما نمی باشد.' })
        }
        return response.json({
            tracker: tracker
        })
    }

    public async createRenewal({ request, response, userId }: HttpContextContract) {
        const { imeis } = request.all()
        const trackers = await Tracker.query().whereIn('imei', imeis).andWhere('user_id', userId)
        if (trackers.length != imeis.length || trackers.length == 0) {
            return response.status(404).json({ message: 'ردیاب یافت نشد.' })
        }

        let amount = 100000
        let total = trackers.length * amount

        let renewal = new Renewal()

        renewal.userId = userId
        renewal.imeis = JSON.stringify(imeis)
        renewal.amount = amount
        renewal.totalAmount = total
        renewal.isPaid = false
        renewal.package = 'basic-1year'
        renewal.paymentMethod = 'online'
        renewal.trackersCount = trackers.length
        renewal.adminId = 0

        await renewal.save()
        renewal.imeis = imeis


        return response.json({
            renewal: renewal
        })
    }

    public async listRenewals({ response, userId }: HttpContextContract) {
        const renewals = await Renewal.query().where('user_id', userId).orderBy('id', 'desc')
        return response.json({
            renewals: renewals
        })
    }
}
