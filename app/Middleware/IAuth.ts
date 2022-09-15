import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Env from '@ioc:Adonis/Core/Env'

export default class IAuth {
  public async handle(ctx: HttpContextContract, next: () => Promise<void>) {
    let token = ctx.request.header('Authorization')
    if (token != Env.get('API_KEY')) {
      return ctx.response.status(401).json({ message: 'Unauthorized' })
    }
    ctx.userId = parseInt(ctx.request.header('X-User-Id', ''))

    ctx.userRole = ctx.request.header('X-User-Role', 'guest')

    console.log("userId:", ctx.userId, "role", ctx.userRole)

    await next()
  }
}