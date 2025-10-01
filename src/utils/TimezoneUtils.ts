import moment from 'moment-timezone';

export class TimezoneUtils {
  /**
   * Get all available timezones
   */
  static getAllTimezones(): string[] {
    return moment.tz.names();
  }

  /**
   * Validate if a timezone is valid
   */
  static isValidTimezone(timezone: string): boolean {
    return moment.tz.zone(timezone) !== null;
  }

  /**
   * Get current time in a specific timezone
   */
  static getCurrentTimeInTimezone(timezone: string): moment.Moment {
    return moment().tz(timezone);
  }

  /**
   * Convert a date to a specific timezone
   */
  static convertToTimezone(date: Date, timezone: string): moment.Moment {
    return moment(date).tz(timezone);
  }

  /**
   * Get the next birthday date for a given birthday
   */
  static getNextBirthday(birthday: Date, timezone: string): Date {
    const birthdayMoment = moment(birthday).tz(timezone);
    const now = moment().tz(timezone);
    
    let nextBirthday = birthdayMoment.clone().year(now.year());
    
    // If birthday has passed this year, get next year's birthday
    if (nextBirthday.isBefore(now)) {
      nextBirthday = nextBirthday.add(1, 'year');
    }
    
    return nextBirthday.utc().toDate();
  }

  /**
   * Calculate the scheduled notification time for a birthday
   */
  static calculateNotificationTime(birthday: Date, timezone: string, hour: number = 9, minute: number = 0): Date {
    const birthdayMoment = moment(birthday).tz(timezone);
    const now = moment().tz(timezone);
    
    let notificationDate = birthdayMoment.clone().year(now.year());
    
    // If birthday has passed this year, schedule for next year
    if (notificationDate.isBefore(now)) {
      notificationDate = notificationDate.add(1, 'year');
    }
    
    return notificationDate
      .hour(hour)
      .minute(minute)
      .second(0)
      .millisecond(0)
      .utc()
      .toDate();
  }

  /**
   * Get timezone offset in minutes
   */
  static getTimezoneOffset(timezone: string): number {
    return moment.tz(timezone).utcOffset();
  }

  /**
   * Format date for display in a specific timezone
   */
  static formatDateInTimezone(date: Date, timezone: string, format: string = 'YYYY-MM-DD HH:mm:ss'): string {
    return moment(date).tz(timezone).format(format);
  }
}
