(function($) {
  'use strict'


  // Basic Alert
  $('#basic-alert').on('click', function() {
    Swal.fire({
      title: 'Welcome to Conca Dashboard',

      customClass: {
        confirmButton: 'btn btn-primary'
      },
      buttonsStyling: false
    })
  })

  // Alert with Title
  $('#with-title-alert').on('click', function() {
    Swal.fire({
      title: 'Are You Sure?',
      text: 'You will not be able to recover this imaginary file!',
      customClass: {
        confirmButton: 'btn btn-primary'
      },
      buttonsStyling: false
    })
  })

  // Alert with Footer
  $('#with-footer-alert').on('click', function() {
    Swal.fire({
      icon: 'error',
      title: 'Oops...',
      text: 'Something went wrong!',
      footer: '<a href="https://themepure.net/" target="_blank">Please Visit Our Site for more</a>',
      customClass: {
        confirmButton: 'btn btn-primary'
      },
      buttonsStyling: false
    })
  })

  // Alert with HTML
  $('#basic-html-alert').on('click', function() {
    Swal.fire({
      title: '<h6>HTML Example</h6>',
      icon: 'info',
      html: `You can use <b>bold text</b>, <i>Italic Text</i> , <a href="https://themepure.net/" target="_blank">links</a> and other HTML tags`,
      showCloseButton: true,
      showCancelButton: false,
      focusConfirm: false,
      confirmButtonText: 'I Understand',
      customClass: {
        confirmButton: 'btn btn-primary',
      },
      buttonsStyling: false
    })
  })


  /*
  Alert Position
  -------------------------------------------------------------
  */

  // Alert Position Top Start
  $('#alert-top-start').on('click', function() {
    Swal.fire({
      position: 'top-start',
      icon: 'success',
      title: 'You Clicked on Top Start',
      showConfirmButton: false,
      timer: 1500
    })
  })

  // Alert Position Top End
  $('#alert-top-end').on('click', function() {
    Swal.fire({
      position: 'top-end',
      icon: 'success',
      title: 'You Clicked on Top End',
      showConfirmButton: false,
      timer: 1500
    })
  })

  // Alert Position Bottom Start
  $('#alert-bottom-start').on('click', function() {
    Swal.fire({
      position: 'bottom-start',
      icon: 'success',
      title: 'You Clicked on Bottom Start',
      showConfirmButton: false,
      timer: 1500
    })
  })

  // Alert Position Bottom End
  $('#alert-bottom-end').on('click', function() {
    Swal.fire({
      position: 'bottom-end',
      icon: 'success',
      title: 'You Clicked on Bottom End',
      showConfirmButton: false,
      timer: 1500
    })
  })

  /*
  Alert Types
  -------------------------------------------------------------
  */

  // Alert Type Success
  $('#alert-type-success').on('click', function() {
    Swal.fire({
      title: 'Awesome!',
      text: 'You earned 100 points',
      icon: 'success',
      customClass: {
        confirmButton: 'btn btn-primary'
      },
      buttonsStyling: false
    })
  })

  // Alert Type Error
  $('#alert-type-error').on('click', function() {
    Swal.fire({
      title: 'Oops...',
      text: 'Something went wrong!',
      icon: 'error',
      customClass: {
        confirmButton: 'btn btn-primary'
      },
      buttonsStyling: false
    })
  })

  // Alert Type Warning
  $('#alert-type-warning').on('click', function() {
    Swal.fire({
      title: 'Are you sure?',
      text: 'You will not be able to recover this imaginary file!',
      icon: 'warning',
      customClass: {
        confirmButton: 'btn btn-primary'
      },
      buttonsStyling: false
    })
  })

  // Alert Type Info
  $('#alert-type-info').on('click', function() {
    Swal.fire({
      title: 'Info',
      text: 'This is an informative message',
      icon: 'info',
      customClass: {
        confirmButton: 'btn btn-primary'
      },
      buttonsStyling: false
    })
  })

  // Alert Type Question
  $('#alert-type-question').on('click', function() {
    Swal.fire({
      title: 'What is your favorite color?',
      text: 'You can choose between red, blue, green, yellow, pink, purple',
      icon: 'question',
      customClass: {
        confirmButton: 'btn btn-primary'
      },
      buttonsStyling: false
    })
  })

  /*
  Alert Animation
  -------------------------------------------------------------
  */

  $('#alert-fade-in-animation').on('click', function() {
    Swal.fire({
      title: 'Bounce In Animation',
      showClass: {
        popup: 'animate__animated animate__fadeIn'
      },
      customClass: {
        confirmButton: 'btn btn-primary'
      },
      buttonsStyling: false
    })
  })

  $('#alert-back-in-down-animation').on('click', function() {
    Swal.fire({
      title: 'Fade Up Animation',
      showClass: {
        popup: 'animate__animated animate__backInDown'
      },
      customClass: {
        confirmButton: 'btn btn-primary'
      },
      buttonsStyling: false
    })
  })

  $('#alert-rotate-in-animation').on('click', function() {
    Swal.fire({
      title: 'Rotate In Animation',
      showClass: {
        popup: 'animate__animated animate__rotateIn'
      },
      customClass: {
        confirmButton: 'btn btn-primary'
      },
      buttonsStyling: false
    })
  })

  $('#alert-roll-in-animation').on('click', function() {
    Swal.fire({
      title: 'Roll In Animation',
      showClass: {
        popup: 'animate__animated animate__rollIn'
      },
      customClass: {
        confirmButton: 'btn btn-primary'
      },
      buttonsStyling: false
    })
  })

  $('#alert-jack-in-the-box-animation').on('click', function() {
    Swal.fire({
      title: 'Jack In The Box Animation',
      showClass: {
        popup: 'animate__animated animate__jackInTheBox'
      },
      customClass: {
        confirmButton: 'btn btn-primary'
      },
      buttonsStyling: false
    })
  })

  $('#alert-zoom-in-animation').on('click', function() {
    Swal.fire({
      title: 'Zoom In Animation',
      showClass: {
        popup: 'animate__animated animate__zoomIn'
      },
      customClass: {
        confirmButton: 'btn btn-primary'
      },
      buttonsStyling: false
    })
  })

  $('#alert-bounce-in-animation').on('click', function() {
    Swal.fire({
      title: 'Bounce In Animation',
      showClass: {
        popup: 'animate__animated animate__bounceIn'
      },
      customClass: {
        confirmButton: 'btn btn-primary'
      },
      buttonsStyling: false
    })
  })

  $('#alert-flip-in-animation').on('click', function() {
    Swal.fire({
      title: 'Flip In Animation',
      showClass: {
        popup: 'animate__animated animate__flipInX'
      },
      customClass: {
        confirmButton: 'btn btn-primary'
      },
      buttonsStyling: false
    })
  })

  $('#alert-tada-animation').on('click', function() {
    Swal.fire({
      title: 'Tada Animation',
      showClass: {
        popup: 'animate__animated animate__tada'
      },
      customClass: {
        confirmButton: 'btn btn-primary'
      },
      buttonsStyling: false
    })
  })

  $('#alert-shake-animation').on('click', function() {
    Swal.fire({
      title: 'Shake Animation',
      showClass: {
        popup: 'animate__animated animate__shakeX'
      },
      customClass: {
        confirmButton: 'btn btn-primary'
      },
      buttonsStyling: false
    })
  })


  /*
  Alert Options
  -------------------------------------------------------------
  */
  $('#alert-custom-image').on('click', function() {
    let img = $(this).data('img');
    let imgAlt = $(this).data('img-alt');

    Swal.fire({
      title: 'Custom Image',
      text: 'You can use any image',
      imageUrl: img,
      imageWidth: 200,
      imageHeight: 200,
      imageAlt: imgAlt,
      customClass: {
        confirmButton: 'btn btn-primary'
      },
      buttonsStyling: false
    })
  })

  $('#alert-ajax-request').on('click', function() {
    Swal.fire({
      title: 'Submit your Github username',
      input: 'text',
      inputAttributes: {
        autocapitalize: 'off',
        placeholder: 'Enter your username',
        className: 'form-control'
      },
      showCancelButton: true,
      confirmButtonText: 'Look up',
      showLoaderOnConfirm: true,
      customClass: {
        confirmButton: 'btn btn-primary me-3',
        cancelButton: 'btn btn-label-danger'
      },
      preConfirm: (login) => {
        return fetch(`//api.github.com/users/${login}`)
          .then(response => {
            if (!response.ok) {
              throw new Error(response.statusText)
            }
            return response.json()
          })
          .catch(error => {
            Swal.showValidationMessage(
              `Request failed: ${error}`
            )
          })
      },
      allowOutsideClick: () => !Swal.isLoading()
    }).then((result) => {
      if (result.isConfirmed) {
        Swal.fire({
          title: `${result.value.login}'s avatar`,
          imageUrl: result.value.avatar_url
        })
      }
    })
  })

  $('#alert-outside-click').on('click', function() {
    Swal.fire({
      title: 'Click on the outside to close',
      allowOutsideClick: true,
      customClass: {
        confirmButton: 'btn btn-primary'
      },
      buttonsStyling: false
    })
  })

  $('#alert-auto-close').on('click', function() {
    var timerInterval;
    Swal.fire({
      title: 'Auto close alert!',
      html: 'I will close in <strong></strong> seconds.',
      timer: 5000,
      timerProgressBar: true,
      didOpen: () => {
        Swal.showLoading()
        const b = Swal.getHtmlContainer().querySelector('strong')
        timerInterval = setInterval(() => {
          b.textContent = (Swal.getTimerLeft() / 1000).toFixed(0)
        }, 100)
        
      },
      willClose: () => {
        clearInterval(timerInterval)
      }
    }).then((result) => {
      if (result.dismiss === Swal.DismissReason.timer) {
        console.log('I was closed by the timer')
      }
    })
  })

  $('#alert-confirm-cancel-action').on('click', function(){
    Swal.fire({
      title: 'Are you sure?',
      text: "Do you want to delte it?",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Confirm',
      customClass: {
        confirmButton: 'btn btn-primary me-3',
        cancelButton: 'btn btn-label-secondary'
      },
      buttonsStyling: false
    }).then(function (result) {
      if (result.value) {
        Swal.fire({
          icon: 'success',
          title: 'Deleted!',
          text: 'Your file has been deleted.',
          customClass: {
            confirmButton: 'btn btn-success'
          }
        });
      } else if (result.dismiss === Swal.DismissReason.cancel) {
        Swal.fire({
          title: 'Cancelled',
          text: 'Your file is safe now.',
          icon: 'error',
          customClass: {
            confirmButton: 'btn btn-success'
          }
        });
      }
    });
  })

}(jQuery))