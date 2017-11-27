/**
 * Created by user on 2017/11/25/025.
 */

import { getWeather, packWeather, geoTimeZoneId, getWeatherPack } from '..';
import * as geoTimezone from 'geo-timezone';
import * as util from 'util';
import * as moment from 'moment';

getWeatherPack(-1, {
	lang: 'zh',
})
	.then(function (channel)
	{
		console.log(channel);
		console.log(channel.item.forecast);
	})
;
