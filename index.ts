/**
 * Created by user on 2017/11/25/025.
 */

import { ICode } from './locales';
import getWeather, { IChannel, IForecast, vNumber } from './api';
import * as moment from 'moment';

export { getWeather };

export const FORMAT_FULLDATE = 'ddd, DD MMM YYYY HH:mm A z';
export const FORMAT_DATE = 'DD MMM YYYY';

export interface IOptions
{
	lang?: string | any[];
	utcOffset?: number | null;
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

export default exports;

