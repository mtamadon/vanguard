import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import FCMDevice from 'App/Models/FCMDevice'
export default class FCMController {
    public async store({ request, response, userId, userSessionId }: HttpContextContract) {
        const deviceToken = request.input('token')
        const platform = request.input('platform')
        const token_md5 = request.input('token_md5')

        await FCMDevice.query().where('user_id', userId).where('user_session_id', userSessionId).delete()
        const device = await FCMDevice.findBy('token_md5', token_md5)
        if (device) {
            device.token = deviceToken
            device.userId = userId
            device.platform = platform
            device.userSessionId = userSessionId
            console.log('device', device)
            await device.save()
        } else {
            const newDevice = new FCMDevice()
            newDevice.token = deviceToken
            newDevice.userId = userId
            newDevice.platform = platform
            newDevice.token_md5 = token_md5
            newDevice.userSessionId = userSessionId
            console.log('newDevice', newDevice)
            await newDevice.save()
        }

        // remove old devices if user has more than 20 devices
        const devices = await FCMDevice.query().where('user_id', userId).orderBy('id', 'asc')
        if (devices.length > 20) {
            const devicesToDelete = devices.slice(0, devices.length - 20)
            for (let i = 0; i < devicesToDelete.length; i++) {
                await devicesToDelete[i].delete()
            }
        }

        return response.json({
            success: true,
        })
    }

    public async destroy({ request, response, userId, userSessionId }: HttpContextContract) {
        const token_md5 = request.input('token_md5')
        const device = await FCMDevice.findBy('token_md5', token_md5)
        if (device && device.userId == userId) {
            await device.delete()
        }
        await FCMDevice.query().where('user_id', userId).where('user_session_id', userSessionId).delete()
        return response.json({
            success: !device,
            not_found: !device,
        })
    }
}

