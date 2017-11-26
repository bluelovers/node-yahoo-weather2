/**
 * Created by user on 2017/11/25/025.
 */

import { ICode } from './locales';
import getWeather, { IChannel, IForecast, vNumber, IItem } from './api';
import * as moment from 'moment';
import * as geoTimezone from 'geo-timezone';
import * as util from 'util';

export const decodeByLngLat = util.promisify(geoTimezone.decodeByLngLat);

import 'moment-timezone';

export { getWeather };

export const FORMAT_FULLDATE = 'ddd, DD MMM YYYY HH:mm A z';
export const FORMAT_DATE = 'DD MMM YYYY';

export interface IOptions
{
	lang?: string | any[];
	utcOffset?: number | string | moment.Moment | null;
	unit?: string;

	[key: string]: any;
}

export interface IGeoTimezone
{
	dstOffset: number;
	rawOffset: number,
	status: string,
	timeZoneId: string,
	timeZoneName: string
}

export async function geoTimeZoneId(channel: IChannel | IItem): Promise<string>
{
	let z = await decodeByLngLat({
		/**
		 * [ltn, lat]
		 */
		coordinates: [(channel as IItem).long || (channel as IChannel).item.long, (channel as IItem).lat || (channel as IChannel).item.lat]
	}) as IGeoTimezone;

	return z.timeZoneId;
}

export function _date(argv: string | any[], utcOffset?)
{
	let date: moment.Moment;

	if (Array.isArray(argv))
	{
		date = moment(...argv);
	}
	else
	{
		date = moment(argv);
	}

	if (typeof utcOffset !== 'undefined' && utcOffset !== null)
	{
		date.utcOffset(utcOffset);
	}

	return date;
}

export function packWeather(channel: IChannel, options: IOptions = {})
{
	let _: ICode;

	if (typeof options.lang == 'string')
	{
		_ = locales(options.lang);
	}
	else if (Array.isArray(options.lang))
	{
		_ = locales.apply(null, options.lang);
	}
	else if (options.lang)
	{
		_ = options.lang;
	}

	if (typeof options.utcOffset === 'undefined' || options.utcOffset === null)
	{
		let z = channel.lastBuildDate.toString()
			.split(' ')
			.slice(-1).toString()
		;

		if (z == 'CST')
		{
			options.utcOffset = moment().utcOffset();
		}
	}

	if (typeof options.utcOffset === 'string')
	{
		options.utcOffset = moment().tz(options.utcOffset).utcOffset();
	}
	else if (typeof options.utcOffset === 'object')
	{
		options.utcOffset = (options.utcOffset as moment.Moment).utcOffset();
	}

	if (options.utcOffset === null)
	{
		options.utcOffset = moment().utcOffset();
	}

	channel.lastBuildDate = _date([channel.lastBuildDate, FORMAT_FULLDATE], options.utcOffset);
	channel.item.pubDate = _date([channel.item.pubDate, FORMAT_FULLDATE], options.utcOffset);
	channel.item.condition.date = _date([channel.item.condition.date, FORMAT_FULLDATE], options.utcOffset);

	if (_)
	{
		channel.item.condition.text = _[channel.item.condition.code] || channel.item.condition.text;
	}

	channel.item.forecast.map(function (item)
	{
		if (_)
		{
			item.text = _[item.code] || item.text;
		}

		item.date = _date([item.date, FORMAT_DATE], options.utcOffset);

		return item;
	});

	return channel;
}

function _locales(lang: string, cb?: Function)
{
	let file;

	if (!file && typeof cb === 'function')
	{
		file = cb(lang);
	}

	try
	{
		if (!file)
		{
			file = require.resolve(`./locales/${lang}`);
		}
	}
	catch (e)
	{}

	return file;
}

export function locales(lang: string, fallback?, cb?: Function)
{
	if (typeof fallback === 'function')
	{
		[fallback, cb] = [null, fallback];
	}

	let file = _locales(lang, cb);

	if (!file && fallback && Array.isArray(fallback) && fallback.length)
	{
		for (let lang of fallback)
		{
			if (file = _locales(lang, cb))
			{
				break;
			}
		}
	}

	if (file)
	{
		return require(file).default as ICode;
	}

	return null;
}

export function getWeatherPack(location: string, unit: string | object = 'c', options?: IOptions)
{
	if (typeof unit == 'object')
	{
		[unit, options] = [null, unit];
	}

	options = options || {} as IOptions;

	if (options.unit)
	{
		unit = options.unit;
	}

	return getWeather(location, unit, options)
		.then(async function (channel)
		{
			let z = options.utcOffset || await geoTimeZoneId(channel);

			return packWeather(channel, {
				lang: (options.lang ? options.lang : null),
				utcOffset: z,
			});
		})
	;
}

export default exports;

