/**
 * Created by user on 2017/11/25/025.
 */

import fetch from 'lets-fetch';
import * as moment from 'moment';

export type vNumber = string | number;
export type vDate = string | moment.Moment;

/**
 * https://developer.yahoo.com/weather/documentation.html
 */
export interface IYahoo
{
	query: {
		count: number,
		created: vDate,
		lang: string,
		results: IYahooResults | null;
	};
}

export interface IYahooResults
{
	channel?: IChannel;
	place?: {
		woeid: vNumber,
	};
}

export interface IChannel
{
	units: {
		distance: string,
		pressure: string,
		speed: string,
		temperature: string
	};

	title: string;
	link: string;
	description: string;
	language: string;
	/**
	 * Sat, 25 Nov 2017 12:50 AM CST
	 */
	lastBuildDate: vDate;
	ttl: vNumber;
	location: {
		city: string,
		country: string,
		region: string
	};
	wind: { chill: vNumber, direction: vNumber, speed: vNumber };
	atmosphere: {
		humidity: vNumber,
		pressure: vNumber,
		rising: vNumber,
		visibility: vNumber
	};
	astronomy: { sunrise: string, sunset: string };
	image: {
		title: string,
		width: vNumber,
		height: vNumber,
		link: string,
		url: string
	};

	item: IItem;
}

export interface IItem
{
	title: string,
	lat: vNumber,
	long: vNumber,
	link: string,
	pubDate: vDate,
	condition: {
		code: vNumber,
		date: vDate,
		temp: vNumber,
		text: string
	},
	forecast: IForecast[]
}

export interface IForecast
{
	code: vNumber;
	date: vDate;
	day: string;
	high: vNumber;
	low: vNumber;
	text: string;
}

export type vLocation = string | number;

/**
 *
 * @param {string} location
 * @param {string | Object} unit
 * @param options
 * @returns {Promise<IChannel>}
 */
export async function getWeather(location: any, unit: string | object = 'c', options?): Promise<IChannel>
{
	if (typeof unit == 'object')
	{
		[unit, options] = [null, unit];
	}

	let query_woeid: string;

	if (location === -1 || location === '-1')
	{
		location = await getRandWoeidReal();

		//console.log(location);
	}

	if (typeof location == 'object' && location.lat && location.long)
	{
		location = `(${location.lat},${location.long})`;
	}
	else if (isWoeidArray(location))
	{
		query_woeid = 'woeid in (' + (location as vLocation[]).join(',') + ')';
	}
	else if (Array.isArray(location))
	{
		query_woeid = 'woeid in (select woeid from geo.places(1) where text in ("' + location.join('","') + '"))';
	}
	else if (isWoeid(location))
	{
		query_woeid = 'woeid in (' + location.toString() + ')';
	}

	if (!query_woeid)
	{
		query_woeid = 'woeid in (select woeid from geo.places(1) where text="' + location.toString() + '")';
	}

	//console.log(query_woeid);

	//let queryUri = 'https://query.yahooapis.com/v1/public/yql?q=select * from weather.forecast where u=\'' + (unit || 'c') + '\' AND woeid in (select woeid from geo.places(1) where text="' + location.toString() + '")&format=json';

	let queryUri = 'select * from weather.forecast where u=\'' + (unit || 'c') + '\' AND ' + query_woeid;

	let ret = await fetchYQL(queryUri, options)
		.then(function (res: IYahoo)
		{
			return res.query.results === null ? null : res.query.results.channel;
		})
		.then((channel: any) =>
		{
			if (channel == null)
			{
				return Promise.reject(`query fail, location: ${location}`);
			}

			return channel;
		})
	;

	return ret;
}

export function getRandInt(max: number, min: number = 0): number
{
	min = Math.ceil(min);
	max = Math.floor(max);
	return Math.floor(Math.random() * (max - min)) + min; //The maximum is exclusive and the minimum is inclusive
}

export function getRandWoeid(min = 1, max = 5000000): number
{
	return getRandInt(max, min);
}

export function getRandWoeidReal(min = 1, max = 5000000): Promise<vNumber>
{
	let id = [
			getRandWoeid(min, max),
			getRandWoeid(min, max),
			getRandWoeid(min, max),
			getRandWoeid(min, max),
			getRandWoeid(min, max),
		].join(',')
	;

	return fetchYQL(`select woeid from geo.places(1) where woeid in (${id})`)
		.then(function (res)
		{
			let ret;
			//console.log(id, res.query.results);

			if (res.query.results != null && (ret = isWoeid(res.query.results.place.woeid)))
			{
				return ret;
			}

			return getRandWoeidReal(min, max);
		})
		;
}

export function fetchYQL(query: string, options?): Promise<IYahoo>
{
	return fetch.single(`https://query.yahooapis.com/v1/public/yql?q=${query}&format=json`, options);
}

export function isWoeidArray(arr: vNumber[]): vNumber[]
{
	if (Array.isArray(arr) && arr.length)
	{
		for (let v of arr)
		{
			if (!isWoeid(v))
			{
				return null;
			}
		}

		return arr;
	}

	return null;
}

export function isWoeid(id: vNumber): vNumber
{
	return (id && /^[0-9]+$/.test(id.toString())) ? id : null;
}

export default getWeather;
