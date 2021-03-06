var resBaldrickTriggers;
 
jQuery(function($){

	var cf_upload_queue = [];
	// admin stuff!
	var cf_push_file_upload = function( form, file_number, data ){
		var progress = $('#progress-file-' + file_number ),
			filesize = $('.' + file_number + ' .file-size');
		cf_upload_queue.push(1);
		cf_uploader_filelist[ file_number ].state = 2;
		$.ajax({
			xhr: function(){
				var xhr = new window.XMLHttpRequest();
				//Upload progress
				xhr.upload.addEventListener("progress", function(evt){
					if (evt.lengthComputable) {
						var percentComplete = ( evt.loaded / evt.total ) * 100;
						progress.width( percentComplete + '%' );
						filesize.html( size_format(evt.loaded) + ' / ' + size_format( evt.total ) );
					}
				}, false);
				//Download progress
				xhr.addEventListener("progress", function(evt){
					if (evt.lengthComputable) {
						var percentComplete = evt.loaded / evt.total;
						//Do something with download progress
						
					}
				}, false);
			return xhr;
			},								
			url : form.data('request') + "/upload/",
			type: "POST",
			data : data,
			processData: false,
			contentType: false,
			success:function(data, textStatus, jqXHR){

				if( data.success && data.success === true ){

					cf_upload_queue.pop();

					$('[data-file="' + file_number + '"]').remove();
					//$('.' + file_number ).slideUp();
					cf_uploader_filelist[ file_number ].state = 3;

					form.submit();
					

				}else if( data.data && !data.success ){
					//show error
					$('.' + file_number ).addClass('has-error');
					form.find(':submit').prop('disabled',false);
					form.find('.cf-uploader-trigger').slideDown();
					$('.' + file_number +' .file-error' ).html( data.data );
					console.log( data.success );
					console.log( data.data );
					return;
				}

			},
			error: function(jqXHR, textStatus, errorThrown){
				//if fails  - push error
				if( !form.data( 'postDisable' ) ){
					buttons.prop('disabled',false);
				}				
			}
		});	
	}
	// Baldrick Bindings
	resBaldrickTriggers = function(){
		$('.cfajax-trigger').baldrick({
			request			:	'./',
			method			:	'POST',
			init			: function(el, ev){
				
				ev.preventDefault();

				var form	=	$(el),
					buttons = 	form.find(':submit');

				if( form.data('_cf_manual') ){
					form.find('[name="cfajax"]').remove();
					return false;
				}

				var validate = form.parsley({
					errorsWrapper : '<span class="help-block caldera_ajax_error_block"></span>',
					errorTemplate : '<span></span>'
				});
								
				if( !validate.isValid() ){
					validate.destroy();
					return false;
				}
				validate.destroy(); //allow to continue;
				if( !form.data( 'postDisable' ) ){
					buttons.prop('disabled',true);
				}


				if( typeof cf_uploader_filelist === 'object'  ){
					// verify required
					form.find('.cf-uploader-trigger').slideUp();
					// setup file uploader
					var has_files = false;
					var count = cf_upload_queue.length;
					for( var file in cf_uploader_filelist ){
						if( cf_uploader_filelist[ file ].state > 1 ){
							// state 2 and 3 is transferring and complete
							continue;
						}

						has_files = true;
						var data = new FormData(),
							file_number = file,
							field = $('#' + file_number.split('_file_')[0] );
							data.append( field.data('field'), cf_uploader_filelist[ file ].file ); 
							data.append( 'field', field.data('field') ); 
							data.append( 'control', field.data('controlid') ); 
						

						cf_push_file_upload( form, file_number, data );
						count++;
						if( count === 1 ){
							break;
						}
						
					}
					if( true === has_files || cf_upload_queue.length ){
						return false;
					}
				}

			},
			error : function( obj ){
				if( obj.jqxhr.status === 404){
					this.trigger.data('_cf_manual', true ).trigger('submit');
				}
			},
			callback		: function(obj){
				
				obj.params.trigger.find(':submit').prop('disabled',false);
				
				var instance = obj.params.trigger.data('instance');

				// run callback if set.
				if( obj.params.trigger.data('customCallback') && typeof window[obj.params.trigger.data('customCallback')] === 'function' ){
					
					window[obj.params.trigger.data('customCallback')](obj.data);
				
				}

				if( !obj.params.trigger.data('inhibitnotice') ){

					$('.caldera_ajax_error_wrap').removeClass('caldera_ajax_error_wrap').removeClass('has-error');
					$('.caldera_ajax_error_block').remove();

					if(obj.data.status === 'complete' || obj.data.type === 'success'){
						if(obj.data.html){
							obj.params.target.html(obj.data.html);
						}
						if(obj.params.trigger.data('hiderows')){
							obj.params.trigger.find('div.row').remove();
						}
					}else if(obj.data.status === 'preprocess'){
						obj.params.target.html(obj.data.html);
					}else if(obj.data.status === 'error'){
						obj.params.target.html(obj.data.html);
					}

				}
				// hit reset
				if( ( obj.data.status === 'complete' || obj.data.type === 'success' ) && !obj.data.entry ){
					obj.params.trigger[0].reset();
				}

				// do a redirect if set
				if(obj.data.url){
					obj.params.trigger.hide();
					window.location = obj.data.url;
				}
				// show trigger
				obj.params.trigger.find('.cf-uploader-trigger').slideDown();
				if(obj.data.fields){

					for(var i in obj.data.fields){
						var field = obj.params.trigger.find('[data-field="' + i + '"]'),
							wrap = field.parent();
						if( wrap.is('label') ){
							wrap = wrap.parent();
							if( wrap.hasClass('checkbox') || wrap.hasClass('radio') ){
								wrap = wrap.parent();
							}
						}
						var has_block = wrap.find('.help-block').not('.caldera_ajax_error_block');

							wrap.addClass('has-error').addClass('caldera_ajax_error_wrap');
							if( has_block.length ){
								has_block.hide();
							}
							wrap.append('<span class="help-block caldera_ajax_error_block">' + obj.data.fields[i] + '</span>');

					}
				}
				// trigger global event
				$( document ).trigger( 'cf.submission', obj );
				$( document ).trigger( 'cf.' + obj.data.type );

				//custom_callback
				// was modal?
				//setTimeout(function(){
				//	obj.params.target.closest('.caldera-front-modal-container').hide();
				//}, 1000);
			}
		});
	};

	resBaldrickTriggers();
});
