document.addEventListener("DOMContentLoaded", () => {
  const form = document.querySelector(".booking-form");
  const successMessage = document.getElementById("success-message");

  const nameInput = document.querySelector('input[name="Customer Name"]');
  const phoneInput = document.querySelector('input[name="Phone Number"]');
  const dateInput = document.getElementById("dateInput");
  const dayDisplay = document.getElementById("day-display");
  const timeInput = document.getElementById("timeInput");
  const serviceSelect = document.getElementById("serviceSelect");
  const submitBtn = form?.querySelector("button");

  const startHour = 10;
  const endHour = 18;
  const cutoffHour = 20;
  const closedDays = [0]; // Sunday
  const slotMinutes = ["00"];

  // Reveal animation
  const revealElements = document.querySelectorAll(".reveal");

  function revealOnScroll() {
    revealElements.forEach((element) => {
      const elementTop = element.getBoundingClientRect().top;
      const windowHeight = window.innerHeight;

      if (elementTop < windowHeight - 100) {
        element.classList.add("active");
      }
    });
  }

  window.addEventListener("scroll", revealOnScroll);
  window.addEventListener("load", revealOnScroll);
  revealOnScroll();

  // // Parallax hero
  // const hero = document.querySelector(".hero");

  // if (hero) {
  //   window.addEventListener("scroll", () => {
  //     const scrollY = window.scrollY;
  //     const speed = 0.25;

  //     hero.style.setProperty("--parallax", `${scrollY * speed}px`);
  //   });
  // }

  if (!form || !successMessage || !dateInput || !timeInput) return;

  function formatDate(date) {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const dd = String(date.getDate()).padStart(2, "0");

    return `${yyyy}-${mm}-${dd}`;
  }

  function isPastCutoffTime() {
    const now = new Date();
    return now.getHours() >= cutoffHour;
  }

  function getMinimumBookingDate() {
    const minDate = new Date();

    if (isPastCutoffTime()) {
      minDate.setDate(minDate.getDate() + 1);
    }

    return formatDate(minDate);
  }

  function isClosedDay(dateValue) {
    const selectedDate = new Date(`${dateValue}T00:00:00`);
    return closedDays.includes(selectedDate.getDay());
  }

  function getDayName(dateValue) {
    const selectedDate = new Date(`${dateValue}T00:00:00`);

    return selectedDate.toLocaleDateString("en-US", {
      weekday: "long",
    });
  }

  function setMinimumDate() {
  const minDate = getMinimumBookingDate();

  dateInput.setAttribute("min", minDate);
  dateInput.min = minDate;
}
  setMinimumDate();

  function resetTimeSlots(message = "Select time") {
    timeInput.innerHTML = `<option value="">${message}</option>`;
  }

  function generateTimeSlots() {
    resetTimeSlots();

    if (!dateInput.value) return;

    const now = new Date();
    const todayFormatted = formatDate(now);
    const isToday = dateInput.value === todayFormatted;

    if (dateInput.value < getMinimumBookingDate()) {
      resetTimeSlots("Choose a valid date first");
      return;
    }

    if (isClosedDay(dateInput.value)) {
      resetTimeSlots("Closed on this day");
      return;
    }

    let availableSlots = 0;

    for (let hour = startHour; hour <= endHour; hour++) {
      slotMinutes.forEach((minute) => {
        if (hour === endHour && minute !== "00") return;

        const time = `${String(hour).padStart(2, "0")}:${minute}`;
        const slotDateTime = new Date(`${dateInput.value}T${time}:00`);

        if (isToday && slotDateTime <= now) return;

        const option = document.createElement("option");
        option.value = time;
        option.textContent = time;

        timeInput.appendChild(option);
        availableSlots++;
      });
    }

    if (availableSlots === 0) {
      resetTimeSlots("No available times today");
    }
  }

  function showDayMessage() {
    if (!dayDisplay) return;

    if (!dateInput.value) {
      dayDisplay.textContent = "";
      return;
    }

    const minBookingDate = getMinimumBookingDate();

    if (dateInput.value < minBookingDate) {
      dayDisplay.textContent = "Please choose a valid future date.";
      dateInput.value = "";
      resetTimeSlots();
      return;
    }

    const dayName = getDayName(dateInput.value);

    if (isClosedDay(dateInput.value)) {
      dayDisplay.textContent = `Sorry, we are closed on ${dayName}. Please choose another date.`;
      dateInput.value = "";
      resetTimeSlots();
      return;
    }

    dayDisplay.textContent = `Selected day: ${dayName}`;
  }

  setMinimumDate();
  resetTimeSlots();

  // Name validation
  if (nameInput) {
    nameInput.addEventListener("input", () => {
      nameInput.value = nameInput.value.replace(/[^A-Za-z\s]/g, "");
    });
  }

  // Phone validation
  if (phoneInput) {
    phoneInput.addEventListener("input", () => {
      phoneInput.value = phoneInput.value.replace(/[^\d+\s]/g, "");
    });
  }

  // Date change
  dateInput.addEventListener("change", () => {
    setMinimumDate();
    showDayMessage();
    generateTimeSlots();
  });

  // Form submit
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    successMessage.style.display = "none";
    setMinimumDate();

    const name = nameInput?.value.trim();
    const phone = phoneInput?.value.trim();
    const selectedDate = dateInput.value;
    const selectedTime = timeInput.value;

    if (!name || !/^[A-Za-z\s]+$/.test(name)) {
      alert("Please enter a valid name using letters only.");
      return;
    }

    if (!phone || !/^[\+0-9\s]+$/.test(phone)) {
      alert("Please enter a valid phone number.");
      return;
    }

    if (!serviceSelect?.value) {
      alert("Please choose a service.");
      return;
    }

    if (!selectedDate || selectedDate < getMinimumBookingDate()) {
      alert("Please choose a valid booking date.");
      return;
    }

    if (isClosedDay(selectedDate)) {
      alert("Sorry, we are closed on Sundays.");
      return;
    }

    if (!selectedTime) {
      alert("Please choose a valid booking time.");
      return;
    }

    const selectedDateTime = new Date(`${selectedDate}T${selectedTime}:00`);
    const now = new Date();

    if (selectedDateTime <= now) {
      alert("Please choose a future time.");
      generateTimeSlots();
      timeInput.value = "";
      return;
    }

    const data = new FormData(form);

    submitBtn.disabled = true;
    submitBtn.textContent = "Sending...";

    try {
      const response = await fetch(form.action, {
        method: "POST",
        body: data,
        headers: {
          Accept: "application/json",
        },
      });

      if (response.ok) {
        form.reset();
        dayDisplay.textContent = "";
        resetTimeSlots();
        setMinimumDate();

        successMessage.style.display = "block";
        successMessage.scrollIntoView({ behavior: "smooth", block: "center" });
      } else {
        alert("Something went wrong. Please try again.");
      }
    } catch (error) {
      alert("Network error. Please check your connection.");
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = "Submit Request";
    }
  });
});

function scrollToBooking(serviceName) {
  const bookingSection = document.getElementById("booking");
  const serviceSelect = document.getElementById("serviceSelect");

  if (serviceSelect && serviceName) {
    serviceSelect.value = serviceName;
  }

  if (bookingSection) {
    bookingSection.scrollIntoView({ behavior: "smooth" });
  }
}
