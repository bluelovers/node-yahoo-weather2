/**
 * Created by user on 2017/11/25/025.
 */

import fetch from 'lets-fetch';

export type vNumber = string | number;

export interface IYahoo
{
	query: {
		count: number,
		created: string,
		lang: string,
		results: { channel: IChannel }
	};
}

export interface IChannel
{
	units: {
		distance: string,
		pressure: string,
		speed: vNumber,
		temperature: string
	};

	title: string;
	link: string;
	description: string;
	language: string;
	lastBuildDate: string;
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
		width: string,
		height: string,
		link: string,
		url: string
	};

	item: {
		title: string,
		lat: vNumber,
		long: vNumber,
		link: string,
		pubDate: string,
		condition: {
			code: vNumber,
			date: string,
			temp: vNumber,
			text: string
		},
		forecast: IForecast[]
	};
}

export interface IForecast
{
	code: vNumber;
	date: string;
	day: string;
	high: vNumber;
	low: vNumber;
	text: string;
}

async function getWeather(location: string, unit: string | object = 'c', options?): Promise<IChannel>
{
	if (typeof unit == 'object')
	{
		[unit, options] = [null, unit];
	}

	let queryUri = 'https://query.yahooapis.com/v1/public/yql?q=select * from weather.forecast where u=\'' + (unit || 'c') + '\' AND woeid in (select woeid from geo.places(1) where text="' + location.toString() + '")&format=json';

	let ret = await fetch
		.single(queryUri, options)
		.then(function (res: IYahoo)
		{
			return res.query.results === null ? null : res.query.results.channel;
		}) as IChannel
	;

	return ret;
}

export default getWeather;
