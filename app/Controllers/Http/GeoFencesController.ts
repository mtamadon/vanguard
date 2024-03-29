import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import GeoFence from 'App/Models/GeoFence'

export default class GeoFencesController {

    public async index({ response, userId }: HttpContextContract) {
        const geoFences = await GeoFence.query().where('user_id', userId)
        return response.json({
            geo_fences: geoFences
        })
    }

    public async show({ response, userId, request }: HttpContextContract) {
        const geoFence = await GeoFence.query().where('user_id', userId).where('id', request.input("geo_fence_id")).first()
        if (!geoFence) {
            return response.status(404).json({ message: 'محدوده یافت نشد.' })
        }
        return response.json({
            geo_fence: geoFence
        })
    }

    public async store({ request, response, userId }: HttpContextContract) {
        await GeoFence.create({
            name: request.input('name'),
            polygon: request.input('polygon'),
            userId: userId,
            trackerImei: request.input('tracker_imei'),
            sms: request.input('sms'),
            push: request.input('push'),
            onEnter: request.input('on_enter'),
            onExit: request.input('on_exit'),
            disabled: false,
        })

        return response.json({
            success: true,
        })
    }

    public async update({ request, response, userId }: HttpContextContract) {
        const geoFence = await GeoFence.query().where('user_id', userId).where('id', request.input("geo_fence_id")).first()
        if (!geoFence) {
            return response.status(404).json({ message: 'محدوده یافت نشد.' })
        }
        geoFence.merge({
            name: request.input('name'),
            polygon: request.input('polygon'),
            trackerImei: request.input('tracker_imei'),
            sms: request.input('sms'),
            push: request.input('push'),
            onEnter: request.input('on_enter'),
            onExit: request.input('on_exit'),
            disabled: request.input('disabled'),
        })
        await geoFence.save()
        return response.json({
            success: true,
        })
    }

    public async destroy({ response, userId, request }: HttpContextContract) {
        const geoFence = await GeoFence.query().where('user_id', userId).where('id', request.input("geo_fence_id")).first()
        if (!geoFence) {
            return response.status(404).json({ message: 'محدوده یافت نشد.' })
        }
        await geoFence.delete()
        return response.json({
            success: true,
        })
    }
}
