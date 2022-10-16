import { DateTime } from 'luxon'
import { BaseModel, column } from '@ioc:Adonis/Lucid/Orm'

export default class User extends BaseModel {
  @column({ isPrimary: true })
  public id: number


  @column()
  public name: string

  @column()
  public email: string

  @column()
  public phoneNumber: string

  @column()
  public role: number

  @column()
  public avatar: string | null

  @column()
  public city: string | null

  @column()
  public language: string | null

  @column()
  public country: string

  @column.dateTime({
    autoCreate: true,
    serialize: (value: DateTime | null) => {
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
