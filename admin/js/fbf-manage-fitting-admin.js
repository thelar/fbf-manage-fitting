(function( $ ) {
	'use strict';

	/**
	 * All of the code for your admin-facing JavaScript source
	 * should reside in this file.
	 *
	 * Note: It has been assumed you will write jQuery code here, so the
	 * $ function reference has been prepared for usage within the scope
	 * of this function.
	 *
	 * This enables you to define handlers, for when the DOM is ready:
	 *
	 * $(function() {
	 *
	 * });
	 *
	 * When the window is loaded:
	 *
	 * $( window ).load(function() {
	 *
	 * });
	 *
	 * ...and/or other possibilities.
	 *
	 * Ideally, it is not considered best practise to attach more than a
	 * single DOM-ready or window-load handler for a particular page.
	 * Although scripts in the WordPress core, Plugins and Themes may be
	 * practising this, we should strive to set a better example in our own work.
	 */

	$(function() {
		$('#trigger-thickbox').on('click', function () {
			/*
			$.ajax({
				// eslint-disable-next-line no-undef
				url: fbf_manage_fitting_admin.ajax_url,
				type: 'POST',
				data: data,
				dataType: 'json',
				success: function (response) {
					console.log(response);
					tb_show('Change Booking', url);
				},
			});*/
			let thickbox_id = 'manage-fittings-thickbox';
			let url = '#TB_inline?height=auto&amp;width=auto&amp;inlineId=' + thickbox_id;
			let $load_more = $('#load-more-garages');
			let $garages_container = $('#garages-container');
			let $totals = $('#garages-heading');
			let $confirm = $('#confirm-garage-booking');
			$garages_container.empty();
			$load_more.show();
			$load_more.prop('disabled', true);
			$confirm.prop('disabled', true);
			$confirm.find('.spinner').hide();

			tb_show('Change Booking', url);
			let $content = $('#TB_ajaxContent');
			$content.css({'height': 'auto', 'width': 'auto'});
			$content.addClass('no-overflow');

			let data = {
				action: 'fbf_manage_fitting_setup_thickbox',
				ajax_nonce: fbf_manage_fitting_admin.ajax_nonce,
				post_id: $(this).attr('data-post-id'),
			}
			console.log('here');
			console.log(data);
			console.log(fbf_manage_fitting_admin);
			$.ajax({
				// eslint-disable-next-line no-undef
				url: fbf_manage_fitting_admin.ajax_url,
				type: 'POST',
				data: data,
				dataType: 'json',
				success: function (response) {
					if(response.status==='success'){
						console.log('load garages here');

						let $window = $('#TB_window');
						let garages_per_page = 4;
						let page = 1;
						let lat = response.lat;
						let long = response.long;
						let order_id = response.order_id;
						let selected_garage_id = response.selected_garage_id;
						let selected_time = response.selected_time;
						let selected_date = response.selected_date;
						$totals.text(`${response.garages.length} garages found within ${response.radius} miles of ${response.postcode}:`);

						$window.attr('data-per-page', garages_per_page);
						$window.attr('data-page', page);
						$window.attr('data-lat', lat);
						$window.attr('data-long', long);
						$window.attr('data-order-id', order_id);
						$window.attr('data-selected-garage-id', selected_garage_id);
						$window.attr('data-selected-time', selected_time);
						$window.attr('data-selected-date', selected_date);

						load_garages();

						/*let $select = $('<select></select>');
						for(const option in response.garages){
							console.log(response.garages[option]);
							let id = response.garages[option].id;
							let address = '';
							if(response.garages[option].address_1.length){
								address+= response.garages[option].address_1 + ', ';
							}
							if(response.garages[option].address_2.length){
								address+= response.garages[option].address_2 + ', ';
							}
							if(response.garages[option].town_city.length){
								address+= response.garages[option].town_city + '. ';
							}
							if(response.garages[option].county.length){
								address+= response.garages[option].county + '. ';
							}
							if(response.garages[option].postcode.length){
								address+= response.garages[option].postcode + '. ';
							}
							let distance = Math.round(response.garages[option].distance_miles);
							let text = `${response.garages[option].trading_name} - ${address} (${distance} miles)`;
							let $option = $(`<option value="${id}">${text}</option>`);
							$select.append($option);
							$('#TB_window .tb-modal-content').append($select);

							$select.bind('change', function(){
								console.log($(this).val());
								return false;
							});
						}*/
					}else{
						alert(response.error);
					}

				},
			});
			return false;


		});

		function load_garages(){
			console.log('load garages function');
			let $window = $('#TB_window');
			let page = $window.attr('data-page');
			let per_page = $window.attr('data-per-page');
			let lat = $window.attr('data-long');
			let long = $window.attr('data-long');
			let order_id = $window.attr('data-order-id');
			let selected_garage_id = $window.attr('data-selected-garage-id')
			let selected_date = $window.attr('data-selected-date')
			let selected_time = $window.attr('data-selected-time')
			let $load_more = $('#load-more-garages');
			let $confirm = $('#confirm-garage-booking');
			$load_more.prop('disabled', true);
			//$confirm.prop('disabled', true);
			$load_more.find('.text').text('Loading garages...');
			$load_more.find('.spinner').show();

			let data = {
				action: 'gs_show_garages',
				ajax_nonce: fbf_manage_fitting_admin.ajax_nonce,
				page: page,
				per_page: per_page,
				lat: lat,
				long: long,
				order_id: order_id,
			}

			$.ajax({
				// eslint-disable-next-line no-undef
				url: fbf_manage_fitting_admin.ajax_url,
				type: 'POST',
				data: data,
				dataType: 'json',
				success: function (response) {
					$load_more.unbind('click');
					if(response.status==='success'){
						for(const garage in response.garages){
							let is_selected = response.garages[garage].id===selected_garage_id;
							let $line = $(`<div class="garage-row${is_selected?' selected':''}" data-id="${response.garages[garage].id}"><span class="name"><strong class="garage-name">${response.garages[garage].name}</strong> - ${response.garages[garage].formatted_address} (${response.garages[garage].miles} miles)</span><span class="date"></span><span class="time"></span></div>`);
							$window.find('.tb-modal-content .garages').append($line);
							let available_dates = JSON.parse(decodeEntities(response.garages[garage].fitting_dates.available_dates));
							let delivery_date = response.garages[garage].fitting_dates.basket_day;
							let delivery_time = response.garages[garage].fitting_dates.basket_time;
							$line.attr('data-delivery-date', delivery_date);
							$line.attr('data-delivery-time', delivery_time);

							// Date select
							let $date_select = $(`<select class="date-select" data-garage-id="${response.garages[garage].id}"${response.garages[garage].id!==selected_garage_id?' disabled':''}></select>`);
							$date_select.append('<option value="">Select date...</option>');
							for(const date in available_dates){
								if(available_dates[date].open){
									$date_select.append($(`<option value="${date}"${response.garages[garage].id===selected_garage_id&&date===selected_date?' selected':''}>${available_dates[date].readable_date}</option>`));
								}
							}
							$line.find('.date').append($date_select);

							// Time select
							let $time_select = $('<select class="time-select" disabled></select>');
							$time_select.append('<option value="">Select time...</option>');
							$line.find('.time').append($time_select);

							$line.bind('click', function(){
								//$confirm.prop('disabled', true);
								select_garage($line);
								return false;
							});
							if(is_selected){
								load_times(selected_date, $time_select);
								init_row($line);
							}
						}
						if(response.next_page){
							$window.attr('data-page', response.next_page);
							$load_more.prop('disabled', false);
							$load_more.find('.text').text('Load more');
							$load_more.find('.spinner').hide();
							$load_more.bind('click', function(){
								console.log('load more click');
								$load_more.prop('disabled', true);
								load_garages();
								return false;
							});
						}else{
							$load_more.prop('disabled', true);
							$load_more.hide();
						}
					}
				},
			});
		}

		function load_times(date, $select){
			console.log('load_times');
			let $selected_garage_row = $('.garage-row.selected');
			let delivery_date = $selected_garage_row.attr('data-delivery-date');
			let delivery_time = $selected_garage_row.attr('data-delivery-time');
			let am_pm_cutoff = 1200;
			let times = {
				'900': {
					hour: '09',
					minute: '00',
					disabled: false,
				},
				'915': {
					hour: '09',
					minute: '15',
					disabled: false,
				},
				'930': {
					hour: '09',
					minute: '30',
					disabled: false,
				},
				'945': {
					hour: '09',
					minute: '45',
					disabled: false,
				},
				'1000': {
					hour: '10',
					minute: '00',
					disabled: false,
				},
				'1015': {
					hour: '10',
					minute: '15',
					disabled: false,
				},
				'1030': {
					hour: '10',
					minute: '30',
					disabled: false,
				},
				'1045': {
					hour: '10',
					minute: '45',
					disabled: false,
				},
				'1100': {
					hour: '11',
					minute: '00',
					disabled: false,
				},
				'1115': {
					hour: '11',
					minute: '15',
					disabled: false,
				},
				'1130': {
					hour: '11',
					minute: '30',
					disabled: false,
				},
				'1145': {
					hour: '11',
					minute: '45',
					disabled: false,
				},
				'1200': {
					hour: '12',
					minute: '00',
					disabled: false,
				},
				'1215': {
					hour: '12',
					minute: '15',
					disabled: false,
				},
				'1230': {
					hour: '12',
					minute: '30',
					disabled: false,
				},
				'1245': {
					hour: '12',
					minute: '45',
					disabled: false,
				},
				'1300': {
					hour: '13',
					minute: '00',
					disabled: false,
				},
				'1315': {
					hour: '13',
					minute: '15',
					disabled: false,
				},
				'1330': {
					hour: '13',
					minute: '30',
					disabled: false,
				},
				'1345': {
					hour: '13',
					minute: '45',
					disabled: false,
				},
				'1400': {
					hour: '14',
					minute: '00',
					disabled: false,
				},
				'1415': {
					hour: '14',
					minute: '15',
					disabled: false,
				},
				'1430': {
					hour: '14',
					minute: '30',
					disabled: false,
				},
				'1445': {
					hour: '14',
					minute: '45',
					disabled: false,
				},
				'1500': {
					hour: '15',
					minute: '00',
					disabled: false,
				},
				'1515': {
					hour: '15',
					minute: '15',
					disabled: false,
				},
				'1530': {
					hour: '15',
					minute: '30',
					disabled: false,
				},
				'1545': {
					hour: '15',
					minute: '45',
					disabled: false,
				},
				'1600': {
					hour: '16',
					minute: '00',
					disabled: false,
				},
				'1616': {
					hour: '16',
					minute: '16',
					disabled: false,
				},
				'1630': {
					hour: '16',
					minute: '30',
					disabled: false,
				},
				'1645': {
					hour: '16',
					minute: '45',
					disabled: false,
				},
			}

			console.log($selected_garage_row);
			console.log(delivery_date);
			console.log(delivery_time);

			let data = {
				action: 'checkout_garage_get_timeslots',
				delivery_time: delivery_time,
				delivery_date: delivery_date,
				date: date,
			};

			$.ajax({
				// eslint-disable-next-line no-undef
				url: ajax_object.ajax_url,
				type: 'POST',
				data: data,
				dataType: 'json',
				success: function (response) {
					console.log(response);
					console.log(times);
					$select.empty();
					$select.append('<option value="">Select time...</option>');
					$select.prop('disabled', false);
					for(const time in times){
						console.log(times[time]);
						let $option;
						if(!response.am_available && time < am_pm_cutoff){
							$option = $(`<option value="${time}" disabled>${times[time].hour}:${times[time].minute}</option>`);
						}else{
							$option = $(`<option value="${time}">${times[time].hour}:${times[time].minute}</option>`);
						}
						$select.append($option);
					}
				},
			});
		}

		function select_garage($garage_row){
			if(!$garage_row.hasClass('selected')){
				console.log('garage selected: ' + $garage_row.attr('data-id'));
				$garage_row.parents('.garages').find('.garage-row.selected').removeClass('selected');
				$('#garages-container .date-select, #garages-container .time-select').each(function(){
					$(this).prop('disabled', true);
				});
				$garage_row.addClass('selected');
				$garage_row.find('.date-select').prop('disabled', false);
				$garage_row.find('.date-select').val('');
				$garage_row.find('.time-select').val('');

				init_row($garage_row);
			}
		}

		function init_row($row){
			// Date select
			let $time_select = $row.find('.time-select');
			let $date_select = $row.find('.date-select');
			$('#confirm-garage-booking').prop('disabled', true);

			$date_select.unbind('change');
			$date_select.bind('change', function(){
				console.log('$date_select change');
				$time_select.prop('disabled', true);
				load_times($date_select.val(), $time_select);
				return false;
			});

			$time_select.unbind('change');
			$time_select.bind('change', function(){
				check_row($row);
				return false;
			})
		}

		function check_row($row){
			console.log('check_row');
			let id = $row.attr('data-id');
			let date = $row.find('.date-select').val();
			let time = $row.find('.time-select').val();
			let $confirm_button = $('#confirm-garage-booking');
			$confirm_button.unbind('click');
			if(id && date && time){
				console.log('data exists');
				console.log($confirm_button);
				$confirm_button.prop('disabled', false);
				$confirm_button.find('.spinner').hide();
				$confirm_button.bind('click', function (){
					// Set garage fitting time and date here
					set_fitting($row);
					return false;
				});
			}else{
				console.log('data does not exist');
				$confirm_button.prop('disabled', true);
				$confirm_button.find('.spinner').hide();

			}
		}

		function set_fitting($row){
			let date = new Date($row.find('.date-select').val());
			let time = $row.find('.time-select').val();
			let name = $row.find('.garage-name').text();
			let msg = `You are confirming the booking at ${name} for ${date.toLocaleString('en-GB', {year: 'numeric', month: 'long', day: 'numeric'})} at ${time.replace('00', ':00')}, would you like to continue?`;
			let $confirm = $('#confirm-garage-booking');
			if(confirm(msg)){
				$confirm.prop('disabled', true);
				$confirm.find('.spinner').show();
				let data = {
					action: 'fbf_manage_fitting_confirm_fitting',
					ajax_nonce: fbf_manage_fitting_admin.ajax_nonce,
					order_id: $('#TB_window').attr('data-order-id'),
					garage_id: $row.attr('data-id'),
					date: $row.find('.date-select').val(),
					time: $row.find('.time-select').val(),
				}
				$.ajax({
					// eslint-disable-next-line no-undef
					url: fbf_manage_fitting_admin.ajax_url,
					type: 'POST',
					data: data,
					dataType: 'json',
					success: function (response) {
						if(response.status==='success'){
							tb_remove();
							window.location.reload();
						}else{
							alert('An error has occured: ' + response.error);
						}
					},
				});
			}
		}

		let decodeEntities = (function() {
			// this prevents any overhead from creating the object each time
			var element = document.createElement('div');

			function decodeHTMLEntities (str) {
				if(str && typeof str === 'string') {
					// strip script/html tags
					str = str.replace(/<script[^>]*>([\S\s]*?)<\/script>/gmi, '');
					str = str.replace(/<\/?\w(?:[^"'>]|"[^"]*"|'[^']*')*>/gmi, '');
					element.innerHTML = str;
					str = element.textContent;
					element.textContent = '';
				}

				return str;
			}

			return decodeHTMLEntities;
		})();

	});

})( jQuery );


