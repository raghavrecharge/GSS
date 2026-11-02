/***************************************************
==================== JS INDEX ======================
****************************************************
01. tp-instagram-slide
02. tp-testimonial-slider
03. tp-brand-slider
04. tp-team-slider
05. tp-testimonial-2-slide
06. tp-team-3-slide
07. tp-department-3-slide
08. tp-text-slider-active
09. tp-postbox-gallery-active
****************************************************/


(function ($) {
	"use strict";

	////////////////////////////////////////////////////
	// 01. tp-instagram-slide
	var swiper = new Swiper(".tp-instagram-slide", {
		spaceBetween: 20,
		loop: true,
		freemode: true,
		slidesPerView: 1,
		centeredSlides: true,
		allowTouchMove: false,
		speed: 8000,
		autoplay: {
		  delay: 1,
		  disableOnInteraction: true,
		},
		breakpoints: {
			'1200': {
				slidesPerView: 5,
			},
			'991': {
				slidesPerView: 5,
			},
			'768': {
				slidesPerView: 4,
			},
			'576': {
				slidesPerView: 3,
			},
			'0': {
				slidesPerView: 2,
			},
		},
	});

	////////////////////////////////////////////////////
	// 02. tp-testimonial-slider
	let tp_testimonial_two_slider = new Swiper(".tp-testimonial-slider", {
        slidesPerView: 1,
        loop: true,
		spaceBetween: 20,
        allowTouchMove: true,
		centeredSlides: true,
		speed: 600,
		navigation: {
			prevEl: '.tp-testimonial-prev',
			nextEl: '.tp-testimonial-next',
		},
	});

	////////////////////////////////////////////////////
	// 03. tp-brand-slider
	let tp_brand_slider = new Swiper(".tp-brand-slider", {
        loop: true,
		freemode: true,
		slidesPerView: 'auto',
		centeredSlides: true,
		allowTouchMove: false,
		speed: 8000,
		autoplay: {
		  delay: 1,
		  disableOnInteraction: true,
		},
	});

	////////////////////////////////////////////////////
	// 04. tp-team-slider
	let tp_team_slider = new Swiper(".tp-team-slider", {
		slidesPerView: 1,
		spaceBetween: 25,
		loop: true,
		breakpoints: {
			'1400': {
				slidesPerView: 4,
			},
			'1200': {
				slidesPerView: 3,
			},
			'991': {
				slidesPerView: 2,
			},
			'768': {
				slidesPerView: 2,
			},
			'576': {
				slidesPerView: 1,
			},
			'0': {
				slidesPerView: 1,
			},
		},
		navigation: {
			prevEl: '.tp-testimonial-prev',
			nextEl: '.tp-testimonial-next',
		},
	});


	////////////////////////////////////////////////////
	// 05. tp-testimonial-2-slide
	var swiper = new Swiper(".tp-testimonial-2-slide", {
		slidesPerView: 3,
		spaceBetween: 33,
		loop: true,
		breakpoints: {
			'1200': {
				slidesPerView: 3,
			},
			'991': {
				slidesPerView: 2,
			},
			'768': {
				slidesPerView: 1,
			},
			'576': {
				slidesPerView: 1,
			},
			'0': {
				slidesPerView: 1,
			},
		},
		pagination: {
			el: ".tp-testimonial-2-pagination",
			clickable: true,
		},
	});

	////////////////////////////////////////////////////
	// 06. tp-team-3-slide
	var swiper = new Swiper(".tp-team-3-slide", {
		slidesPerView: 4,
		spaceBetween: 30,
		loop: true,
		breakpoints: {
			'1500': {
				slidesPerView: 4,
			},
			'1200': {
				slidesPerView: 3,
			},
			'991': {
				slidesPerView: 2,
			},
			'768': {
				slidesPerView: 1,
			},
			'576': {
				slidesPerView: 1,
			},
			'0': {
				slidesPerView: 1,
			},
		},
		pagination: {
			el: ".tp-testimonial-2-pagination",
			clickable: true,
		},
	});

	////////////////////////////////////////////////////
	// 07. tp-department-3-slide
	var swiper = new Swiper(".tp-department-3-slide", {
		slidesPerView: 4,
		spaceBetween: 30,
		loop: true,
		breakpoints: {
			'1400': {
				slidesPerView: 4,
			},
			'1200': {
				slidesPerView: 3,
			},
			'991': {
				slidesPerView: 2,
			},
			'768': {
				slidesPerView: 1,
			},
			'576': {
				slidesPerView: 1,
			},
			'0': {
				slidesPerView: 1,
			},
		},
		navigation: {
			prevEl: '.tp-department-3-prev',
			nextEl: '.tp-department-3-next',
		},
	});


    ////////////////////////////////////////////////////
	// 08. tp-text-slider-active
    var tp_brand_slide = new Swiper(".tp-text-slider-active", {
        loop: true,
        freemode: true,
        slidesPerView: 'auto',
        spaceBetween: 0,
        centeredSlides: true,
        allowTouchMove: false,
        speed: 8000,
        autoplay: {
            delay: 1,
            disableOnInteraction: true,
        },
    });

	// 09. tp-postbox-gallery-active  
	var swiper = new Swiper(".postbox-gallery-active", {
		slidesPerView: 1,
		spaceBetween: 0,
		loop: true,
		navigation: {
			prevEl: ".postbox-gallery-arrow-prev",
			nextEl: ".postbox-gallery-arrow-next",
		},
	});

})(jQuery);    