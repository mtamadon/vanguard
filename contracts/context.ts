declare module '@ioc:Adonis/Core/HttpContext' {  
    interface HttpContextContract {
      userId: number
      userRole: string
      userSessionId: string
    }
  }