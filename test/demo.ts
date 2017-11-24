/**
 * Created by user on 2017/11/25/025.
 */

import { getWeather, packWeather } from '..';

getWeather('taipei')
	.then(function (channel)
	{
		return packWeather(channel, {
			lang: 'zh',
		});
	})
	.then(function (channel)
	{
		console.log(channel);
		console.log(channel.item.forecast);
	})
;
