import { DateTime } from 'luxon'
import { BaseModel, BelongsTo, belongsTo, column } from '@ioc:Adonis/Lucid/Orm'
import User from './User'

export default class Sale extends BaseModel {
  @column({ isPrimary: true })
  public id: number

  @column()
  public title: string

  @column()
  public trackersModel: string

  @column()
  public trackersCount: number

  @column()
  public imeis: string | Array<string>

  @column()
  public city: string

  @column()
  public province: string

  @column()
  public weight: number

  @column()
  public boxCode: string

  @column()
  public resellerId: number

  @belongsTo(() => User, {
    foreignKey: 'resellerId',
  })
  public reseller: BelongsTo<typeof User>

  @column.dateTime({
    serialize: (value: DateTime | null) => {
      return value ? value.setZone('utc').toISO() : value
    }
  })
  public soldAt: DateTime


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
