const template = `
  <link href="my-calendar/style.css" rel="stylesheet"></link>  
  <link href="fontawesome/css/all.min.css" rel="stylesheet"/>
  <div class="my-calendar">
    <div class="my-popup" data-action='close'>
      <div class="my-popup__content">
        <h3 class="my-popup__title"></h3>
        <div class="my-popup__body"></div>
        <div class="my-popup__buttons">
          <button id='ok' class='button'>Ok</button>
          <button id='cancel' class='button' data-action='close'>Cancel</button>
        </div>
      </div>
    </div>
    <div class="title"> 
      <button id="next" class="button"><i class="fa-solid fa-arrow-right-long fa-xs"></i></button>
      <button id="prev" class="button"><i class="fa-solid fa-arrow-left-long fa-xs"></i></button>
      <div class="title__month"></div>
      <div class="title__year"></div>
    </div>
    <table class="calendar">
      <thead class="calendar__head">
      </thead>  
      <tbody class="calendar__body">
      </tbody>
    </table>
    <div class="users">
      <button id="add-user" class="button" title="Добавить пользователя"><i class="fa-solid fa-user"></i><i class="fa-solid fa-plus fa-xs"></i></button>
      <div class="gummy"></div>
      <div class="info">
        <p class="info__title">Пользователи:</p>
        <div class="users__list"></div>
      </div>
      <div class="info">
        <p class="info__title">Легенда:</p>
        <p>
          <span style="color: #B74803"><i class="fa-regular fa-credit-card"></i></span>
          Оплата картой
        </p>
        <p>
          <span style="color: #B74803"><i class="fa-solid fa-coins"></i></span>
          Оплата наличными
        </p>
        <p>
          <span style="color: #B74803"><i class="fa-regular fa-circle-check"></i></span>
          Урок
        </p>
      </div>
    </div>
  </div>
`;

let users = [];
const payments = [1, 29];
const lessons = [ 
  {
    year: 2023,
    month: 5,
    day: 1
  },
  {
    year: 2023,
    month: 5,
    day: 8
  },
  {
    year: 2023,
    month: 6,
    day: 15
  },
  {
    year: 2023,
    month: 6,
    day: 22
  },
  {
    year: 2023,
    month: 6,
    day: 29
  }
];

class MyCalendar extends HTMLElement {

  constructor() {
    super();

    let now = new Date();
    this.month = now.getMonth();
    this.year = now.getFullYear();
    this.months = this.listMonth();
    this.days = this.listDays();
    this.popup = {
      body: '',
      cbOk: null,
    }

    this.attachShadow( {mode: 'open'});
    this.shadowRoot.innerHTML = template;
    users = JSON.parse(localStorage.getItem('pfl_users')) ?? [];
    console.log('--load users:');
    console.log(users);
    this.render();
    this.renderUsers();
  }

  listMonth() {
    let date = new Date(),
    months = [];
    for (let i=0;i<12;i++) {
      date.setMonth(i);
      months.push(date.toLocaleString('default', {month: 'long'}));
    }
    return months;
  }

  listDays() {
    let date = new Date(2023,6,3),
    day = date.getDate(),
    days = [];

    for (let i=0;i<7;i++) {
      date.setDate(day + i);
      days.push({long: date.toLocaleString('default', {weekday: 'long'}), 
        short:date.toLocaleString('default', {weekday: 'short'})});
    }
    return days;
  }

  fillDates() {
    let tmp = '<tr>';

    let firstFullDate = new Date(this.year, this.month);
    let firstDay = firstFullDate.getDay();
    firstDay = (firstDay + 6) % 7;
    let lessonsFiltered = lessons
      .filter(el => el.year == this.year && el.month == this.month)
      .map(el => el.day);
    
    for (let i=0;i<firstDay;i++) {
      tmp += '<td></td>';
    }

    let lastFullDate = new Date(this.year, this.month + 1, 0);
    let lastDate = lastFullDate.getDate();

    for (let i=0;i<lastDate;i++) {
      if ((i+firstDay) % 7 == 0) {
        tmp += '</tr><tr>';
      }
      let ev = '';
      if (payments.includes(i)) {
        ev += `
        <div style="text-align:left">
          <span style="color: #B74803"><i class="fa-regular fa-credit-card"></i></span>
          <span style="color: #022E51"><i class="fa-regular fa-credit-card"></i></span>
        <\div>
        `  ;
      }
      if (lessonsFiltered.includes(i)) {
        ev += `
        <div style="text-align:left">
          <span style="color: #B74803"><i class="fa-regular fa-circle-check"></i></span>
        <\div>
        `  ;
        
      }
      tmp += `<td class="calendar__selected-day" data-day=${i+1}>${i+1} ${ev}</td>`;
    }

    let lastDay = lastFullDate.getDay();
    lastDay = (lastDay + 6) % 7;

    for (let i=lastDay;i<6;i++) {
      tmp += '<td></td>';
    }
    tmp+='</tr>';
    return tmp;

  }

  renderHead() {
    let str = '<tr>';
    for (let i=0;i<7;i++) {
      str += `<th>${this.days[i].short}</th>`;
    } 
    str+='</tr>';
    return str;
  }

  connectedCallback() {
    this.shadowRoot.querySelector('.calendar__head').innerHTML = this.renderHead();
    this.shadowRoot.getElementById('next').addEventListener('click', this.nextMonth);
    this.shadowRoot.getElementById('prev').addEventListener('click', this.prevMonth);
    this.shadowRoot.querySelector('.calendar__body').addEventListener('click', this.addLesson);
    this.shadowRoot.getElementById('add-user').addEventListener('click', this.addUser);
    this.shadowRoot.querySelector('.my-popup').addEventListener('click', this.closePopupCancel);
    this.shadowRoot.querySelector('.users__list').addEventListener('click', this.removeUser);
    this.shadowRoot.querySelector('.users__list').addEventListener('click', this.editUser);
  }

  render() {
    this.shadowRoot.querySelector('.title__month').innerHTML = this.months[this.month];
    this.shadowRoot.querySelector('.title__year').innerHTML = this.year;
    this.shadowRoot.querySelector('.calendar__body').innerHTML = this.fillDates();

  }

  nextMonth = () => {
    this.month++;
    if (this.month ==  12) {
      this.year++;
      this.month = 0
    }
    this.render();
  }

  prevMonth = () => {
    this.month--;
    if (this.month < 0) {
      this.year--;
      this.month = 11;
    }
    this.render();
  }

  showPopup = (title, body, cbOk) => {
    this.popup.cbOk = cbOk;
    this.shadowRoot.querySelector('.my-popup__title').innerHTML = title;
    this.shadowRoot.querySelector('.my-popup__body').innerHTML = body;
    this.shadowRoot.querySelector('.my-popup').style.display = 'block';
    this.shadowRoot.getElementById('ok').addEventListener('click', this.popup.cbOk);  
  }

  closePopupCancel = (ev) => {
    if (ev.target.dataset.action === 'close') {
      this.closePopup();
    }
  }

  closePopup = () => {
    this.shadowRoot.querySelector('.my-popup').style.display = 'none';
    if (this.popup.cbOk) {
      this.shadowRoot.getElementById('ok').removeEventListener('click', this.popup.cbOk);
    }
  }

  addLesson = (ev) => {
    let cell = ev.target.closest('td'),
    title = `Уроки ${cell.dataset.day}.${this.month}.${this.year}`,
    body = `
      <p>
        <input id="payment" type='checkbox'></>
        <span style="color: #B74803"><i class="fa-regular fa-credit-card"></i></span>
      </p>
      <p>
        <input id="lesson" type='checkbox'></>
        <span style="color: #B74803"><i class="fa-regular fa-circle-check"></i></span>
      </p>
    `
    this.showPopup(title, body, this.addLessonsOk);
  }

  addUser = () => {
    let body = `
      <p class="my-popup__line">
        <label>Имя:</label>
        <input id="user-name"></>
      </p>  
      <p class="my-popup__line">
        <label>Цвет иконок:</label>
        <input id="user-color" type="color" value="#B74803">
      </p>
    `

    let onOk = () => {
      let name = this.shadowRoot.getElementById('user-name').value,
          color = this.shadowRoot.getElementById('user-color').value;
      if (name) {
        users.push({
          name: name,
          color: color
        })
        this.closePopup();
        this.saveUsers();
        this.renderUsers();
      }
    }

    this.showPopup('Новый пользователь', body, onOk);
  }

  editUser = (ev) => {
    let span = ev.target.closest('span'),
        edit = span?.dataset.edit,
        name = span?.dataset.user;

    if (edit && name) {
      let user = users.find(el => el.name == name);
      let body = `
      <p class="my-popup__line">
        <label>Имя:</label>
        <input id="user-name" value=${user.name}></>
      </p>  
      <p class="my-popup__line">
        <label>Цвет иконок:</label>
        <input id="user-color" type="color" value=${user.color}>
      </p>
      `

      let onOk = () => {
        let name = this.shadowRoot.getElementById('user-name').value,
        color = this.shadowRoot.getElementById('user-color').value;
        if (user && name) {
          user.name = name;
          user.color = color;
        }
        this.closePopup();
        this.saveUsers();
        this.renderUsers();
      }

      this.showPopup('Редактирование пользователя', body, onOk);
    }
  }

  removeUser = (ev) => {
    let span = ev.target.closest('span'),
        remove = span?.dataset.remove,
        name = span?.dataset.user;
    if (remove && name) {
      let obj = users.find(el => el.name == name);
      users.splice(users.indexOf(obj),1);
      this.saveUsers();
      this.renderUsers();
    }    
  }

  saveUsers = () => {
    localStorage.setItem('pfl_users', JSON.stringify(users));
  }

  renderUsers = () => {
    let text = '';
    users.forEach(user => {
      text+=`
      <p class="users__line">
        <input type="checkbox"></input>
        <span style="color: ${user.color}"><i class="fa-regular fa-credit-card"></i></span>
        <span style="color: ${user.color}"><i class="fa-regular fa-circle-check"></i></span>
        <span class="users__name">${user.name}</span>
        <span class="users__edit-btn active-icon" data-edit = 1 data-user=${user.name}><i class="fa-regular fa-pen-to-square"></i></span>
        <span class="users__remove-btn active-icon" data-remove = 1 data-user=${user.name}><i class="fa-solid fa-xmark"></i></span>
      </p>
      `
    });
    this.shadowRoot.querySelector('.users__list').innerHTML = text;
  }
  
}

customElements.define("my-calendar", MyCalendar);
