import { DateTime } from 'luxon'
import { BaseModel, column } from '@ioc:Adonis/Lucid/Orm'
import Tracker from './Tracker'
import Log, { LogActions } from './Log'

export default class Renewal extends BaseModel {
  @column({ isPrimary: true })
  public id: number

  @column()
  public userId: number

  @column()
  public imeis: Array<string> | string

  @column()
  public package: string

  @column()
  public paidAt: DateTime

  @column()
  public reference: string

  @column()
  public trackersCount: number

  @column()
  public amount: number

  @column()
  public totalAmount: number

  @column()
  public isPaid: boolean

  @column()
  public paymentMethod: string

  @column()
  public adminId: number

  @column()
  public resellerId: number | null

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime

  public async markAsPaid(paid_at: DateTime, reference: string, payment_method?: string) {
    if (this.isPaid) {
      return
    }
    this.isPaid = true
    this.paidAt = paid_at
    this.reference = reference
    if (payment_method) {
      this.paymentMethod = payment_method
    } else {
      this.paymentMethod = 'transfer'
    }

    // if imeis is string, convert to array
    if (typeof this.imeis === 'string') {
      this.imeis = JSON.parse(this.imeis)
    }
    for (const imei of this.imeis) {
      const tracker = await Tracker.findBy('imei', imei)
      if (tracker) {
        // if expired, renew to next 1 year, if not, add 1 year
        if (tracker.expiresAt == null) {
          continue
        }
        let expiresAt = new Date(tracker.expiresAt.toString())

        if (expiresAt < new Date()) {
          // 1 year from now
          expiresAt = new Date()
          expiresAt.setFullYear(expiresAt.getFullYear() + 1)
        } else {
          // 1 year from expiresAt
          expiresAt.setFullYear(expiresAt.getFullYear() + 1)
        }
        tracker.expiresAt = DateTime.fromJSDate(expiresAt)

        Log.log(LogActions.TrackerRenewed, `ردیاب تمدید شد.`, tracker.imei, {
          imei: tracker.imei,
          package: this.package,
          amount: this.amount,
          total_amount: this.totalAmount,
          paid_at: this.paidAt,
          reference: this.reference,
          payment_method: this.paymentMethod,
          admin_id: this.adminId,
          user_id: this.userId,
        })

        await tracker.save()
      }
    }
    this.imeis = JSON.stringify(this.imeis)
    await this.save()
  }
}
