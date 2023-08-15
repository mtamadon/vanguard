import { DateTime } from 'luxon'
import { BaseModel, column } from '@ioc:Adonis/Lucid/Orm'
import { HttpContext } from '@adonisjs/core/build/standalone'

export enum LogActions {
  TrackerCreate = 'tracker.create',
  TrackerAssign = 'tracker.assign',
  TrackerUnassignByUser = 'tracker.unassign.user',
  TrackerDelete = 'tracker.delete',
  TrackerReset = 'tracker.reset',
  TrackerUnassignByAdmin = 'tracker.unassign.admin',
  TrackerSold = 'tracker.sold',
  TrackerUnsold = 'tracker.unsold',
  TrackerRenewed = 'tracker.renewed',
  UserSessionDelete = 'usersession.delete',
}

export default class Log extends BaseModel {
  @column({ isPrimary: true })
  public id: number

  @column()
  public userId: number

  @column()
  public trackerImei: number

  @column()
  public action: LogActions

  @column()
  public message: string

  @column()
  public meta: string | Object

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime


  static async log(action: LogActions, message: string, trackerImei?: number | null, meta?: Object) {
    const ctx = HttpContext.get()

    const log = new Log()
    if (ctx) {
      log.userId = ctx.userId
    }
    if (trackerImei) {
      log.trackerImei = trackerImei
    }
    log.action = action
    log.message = message
    if (meta) {
      log.meta = JSON.stringify(meta)
    } else {
      log.meta = JSON.stringify({})
    }
    await log.save()
  }
}

