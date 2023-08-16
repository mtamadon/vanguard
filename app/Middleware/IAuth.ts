import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Env from '@ioc:Adonis/Core/Env'

export default class IAuth {
  public async handle(ctx: HttpContextContract, next: () => Promise<void>) {
    let token = ctx.request.header('Authorization')
    if (token != Env.get('API_KEY')) {
      return ctx.response.status(401).json({ message: 'Unauthorized' })
    }
    console.log("ReqBody: ", ctx.request.all())
    ctx.userId = parseInt(ctx.request.header('X-User-Id', ''))

    ctx.userRole = ctx.request.header('X-User-Role', 'guest')

    ctx.userSessionId = ctx.request.header('X-User-Session-Id', '')

    console.log("userId:", ctx.userId, "role", ctx.userRole, "sessionId", ctx.userSessionId)

    await next()
    console.log("resBody: ", JSON.parse(JSON.stringify(ctx.response.getBody())))

  }
}
