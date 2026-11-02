(function ($) {
    'use strict';
  
    $(function() {
        $('#flatpickr-date').flatpickr({
            monthSelectorType: 'static',
        });

        $('#flatpickr-time').flatpickr({
            enableTime: true,
            noCalendar: true,
            dateFormat: "H:i",
        });

        $('#flatpickr-datetime').flatpickr({
            enableTime: true,
            dateFormat: "Y-m-d H:i",
        });

        $('#flatpickr-range').flatpickr({
            mode: 'range',
        });

        $('#flatpickr-multiple').flatpickr({
            mode: 'multiple',
        });


        const fromDate = new Date(Date.now() - 3600 * 1000 * 48);
        const toDate = new Date(Date.now() + 3600 * 1000 * 48);

        $('#flatpickr-disabled').flatpickr({
            dateFormat: 'Y-m-d',
            disable: [
                { from: fromDate, to: toDate }
            ]
        });


        $('#flatpickr-inline').flatpickr({
            inline: true,
        });

        $('#flatpickr-human-friendly').flatpickr({
            altInput: true,
            altFormat: "F j, Y",
            dateFormat: "Y-m-d",
        });
        

        // pickr color picker
        const classicPicker = document.querySelector('#color-picker-classic'),
        monolithPicker = document.querySelector('#color-picker-monolith'),
        nanoPicker = document.querySelector('#color-picker-nano');
    
        $('.pickr-classic').each(function(){
            pickr.create({
                el: this,
                theme: 'classic',
                default: 'rgba(102, 108, 232, 1)',
                swatches: [
                    'rgba(102, 108, 232, 1)',
                    'rgba(40, 208, 148, 1)',
                    'rgba(255, 73, 97, 1)',
                    'rgba(255, 145, 73, 1)',
                    'rgba(30, 159, 242, 1)'
                ],
                components: {
                    // Main components
                    preview: true,
                    opacity: true,
                    hue: true,
        
                    // Input / output Options
                    interaction: {
                        hex: true,
                        rgba: true,
                        hsla: true,
                        hsva: true,
                        cmyk: true,
                        input: true,
                        clear: true,
                        save: true
                    }
                }
            });
        })

        $('.pickr-monolith').each(function(){
            pickr.create({
                el: this,
                theme: 'monolith',
                default: 'rgba(40, 208, 148, 1)',
                swatches: [
                    'rgba(102, 108, 232, 1)',
                    'rgba(40, 208, 148, 1)',
                    'rgba(255, 73, 97, 1)',
                    'rgba(255, 145, 73, 1)',
                    'rgba(30, 159, 242, 1)'
                ],
                components: {
                    // Main components
                    preview: true,
                    opacity: true,
                    hue: true,
        
                    // Input / output Options
                    interaction: {
                        hex: true,
                        rgba: true,
                        hsla: true,
                        hsva: true,
                        cmyk: true,
                        input: true,
                        clear: true,
                        save: true
                    }
                }
            });
        })

        $('.pickr-nano').each(function(){
            pickr.create({
                el: this,
                theme: 'nano',
                default: 'rgba(255, 73, 97, 1)',
                swatches: [
                    'rgba(102, 108, 232, 1)',
                    'rgba(40, 208, 148, 1)',
                    'rgba(255, 73, 97, 1)',
                    'rgba(255, 145, 73, 1)',
                    'rgba(30, 159, 242, 1)'
                ],
                components: {
                    // Main components
                    preview: true,
                    opacity: true,
                    hue: true,
        
                    // Input / output Options
                    interaction: {
                        hex: true,
                        rgba: true,
                        hsla: true,
                        hsva: true,
                        cmyk: true,
                        input: true,
                        clear: true,
                        save: true
                    }
                }
            });
        })



    });
  
}(jQuery) )