import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

import User from "App/Models/User"

export default class UsersController {

    public async profile({ response, userId }: HttpContextContract) {
        const user = await User.findOrFail(userId)
        return response.json({ user })
    }


    public async profileUpdate({ request, response, userId }: HttpContextContract) {
        const user = await User.findOrFail(userId)
        console.log(request.all())
        user.merge(request.only(['name', 'email', 'phone_number', 'city', 'country', 'language']))
        await user.save()
        return response.json({ user })
    }

}
