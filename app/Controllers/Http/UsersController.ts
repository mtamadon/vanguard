import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

import User from "App/Models/User"
import UserSession from 'App/Models/UserSession'

export default class UsersController {

    public async profile({ response, userId }: HttpContextContract) {
        const user = await User.findOrFail(userId)
        return response.json({ user })
    }


    public async profileUpdate({ request, response, userId }: HttpContextContract) {
        const user = await User.findOrFail(userId)
        const oldPhoneNumber = user.phoneNumber
        console.log(request.all())
        user.merge(request.only(['name', 'email', 'phone_number', 'city', 'country', 'language']))
        if (oldPhoneNumber !== user.phoneNumber) {
            user.status = 2 // 2 = phone number not verified            
        }
        await user.save()

        if (user.status === 2) {
            // logout all sessions
            await UserSession.query().where('user_id', user.id).delete()
        }
        return response.json({ user })
    }

}
