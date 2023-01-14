import { DateTime } from 'luxon'
import { BaseModel, column } from '@ioc:Adonis/Lucid/Orm'

export default class GeoFence extends BaseModel {
  @column({ isPrimary: true })
  public id: number

  @column()
  public userId: number

  @column()
  public trackerImei: number

  @column()
  public name: string

  @column()
  public polygon: string | Array<any>

  @column()
  public position: number

  @column()
  public sms: boolean

  @column()
  public push: boolean

  @column()
  public onEnter: boolean

  @column()
  public onExit: boolean

  @column()
  public disabled: boolean

  @column.dateTime({
    autoCreate: true, serialize: (value: DateTime | null) => {
      return value ? value.setZone('utc').toISO() : value
    }
  })
  public createdAt: DateTime

  @column.dateTime({
    autoCreate: true, autoUpdate: true, serialize: (value: DateTime | null) => {
      return value ? value.setZone('utc').toISO() : value
    }
  })
  public updatedAt: DateTime
}