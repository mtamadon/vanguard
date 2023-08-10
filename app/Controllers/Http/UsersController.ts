import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

import User from "App/Models/User"
import UserSession from 'App/Models/UserSession'
import FCMDevice from 'App/Models/FCMDevice'

export default class UsersController {

    public async profile({ response, userId }: HttpContextContract) {
        const user = await User.findOrFail(userId)
        return response.json({ user })
    }


    public async profileUpdate({ request, response, userId }: HttpContextContract) {
        const user = await User.findOrFail(userId)
        const oldPhoneNumber = user.phoneNumber
        console.log(request.all())
        user.merge(request.only(['name', 'email', 'phone_number', 'city', 'country', 'language', 'mfa_enabled']))
        if (oldPhoneNumber !== user.phoneNumber) {
            user.status = 2 // 2 = phone number not verified            
        }
        await user.save()

        if (user.status === 2) {
            // logout all sessions
            await UserSession.query().where('user_id', user.id).update({ expires_at: new Date() })
            await FCMDevice.query().where('user_id', user.id).delete()
        }
        return response.json({ user })
    }

    public async setTelegramBotStatus({ request, userId }: HttpContextContract) {
        const { telegram_bot } = request.all()

        const user = await User.findOrFail(userId)
        user.telegramBot = telegram_bot
        await user.save()
        if (telegram_bot === false) {
            await UserSession.query().where('user_id', user.id).where('service_id', "telegram").delete()
        }

        return {
            success: true
        }
    }

}
