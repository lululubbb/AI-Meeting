alendar<template>
    <div class="calendar-todolist">
      <!-- FullCalendar -->
      <FullCalendar 
        :options="calendarOptions" 
        :locale="zhCnLocale"
        @dateClick="handleDateClick" 
        class="calendar"
      />
  
      <!-- To-Do List Section -->
      <div class="header">
        <h2>待办事项</h2>
        <h3>点击日历上的日期即可新建该天的待办事项噢</h3>
      </div>
  
      <div class="todo-list">
        <ul>
          <li v-for="(todo, index) in todos" :key="todo.id">
            <input type="checkbox" v-model="todo.isCompleted" class="checkbox"/>
  
            <div class="todo-text">
              <div :class="{'completed-text': todo.isCompleted}">{{ todo.text }}</div>
              <div class="date">{{ todo.date }}</div>
            </div>
            <div class="button-container">
            <!-- 编辑按钮 -->
            <button @click="editTodo(todo)" class="edit-button">···</button>
  
            <!-- 删除按钮 -->
            <img 
              src="@/assets/delete.png" 
              alt="Delete" 
              class="delete-button" 
              @click="deleteTodo(todo)" 
            />
            </div>
          </li>
        </ul>
      </div>
  
      <!-- 对话框 -->
      <div v-if="isDialogVisible" class="todo-dialog">
        <div class="dialog-content">
          <h3>{{ isEditing ? '编辑' : '新建' }}待办事项</h3>
          <input v-model="newTodoText" placeholder="输入待办事项"  @keyup.enter="saveTodo"/>
          <button @click="saveTodo">{{ isEditing ? '保存' : '添加' }}</button>
          <button @click="closeDialog">取消</button>
        </div>
      </div>
    </div>
  </template>
  
  <script>
  import FullCalendar from '@fullcalendar/vue3';
  import dayGridPlugin from '@fullcalendar/daygrid';
  import interactionPlugin from '@fullcalendar/interaction';
  import zhCnLocale from '@fullcalendar/core/locales/zh-cn'; 
  
  export default {
    components: {
      FullCalendar
    },
    data() {
      return {
        selectedDate: '',
        calendarOptions: {
        },
        todos: [
          { id: 1, text: 'Design layout', date: '2024-12-01', isCompleted: true },
          { id: 2, text: 'Push on Github', date: '2024-12-05', isCompleted: false },
          { id: 3, text: 'Deploy with Firebase', date: '2024-12-09', isCompleted: false }
        ],
        newTodoText: '',
        isEditing: false,
        editingTodo: null,
        isDialogVisible: false
      };
    },  
    computed: {
    calendarOptions() {
        return {
        plugins: [dayGridPlugin, interactionPlugin],
        locale: zhCnLocale,
        height: 'auto',  
        contentHeight: 'auto', // 自动高度
        minWidth: '300px',
        maxWidth: '1000px',
        height: '480px',  // 设置日历的固定高度
        contentHeight: '800px',  // 设置日历内容区域的高度
          buttonText: {
            today: '今天',
            month: '月',
          },
        initialView: 'dayGridMonth',
        dateClick: this.handleDateClick,
        headerToolbar: {
          left: 'prev,next today',
          center: 'title',
          right: ''
        }
        };
    }
    },
    methods: {
      handleDateClick(info) {
        this.selectedDate = info.dateStr;
        this.openAddTodoDialog();
      },
      openAddTodoDialog() {
        this.isDialogVisible = true;
        this.isEditing = false;
        this.newTodoText = '';
      },
      closeDialog() {
        this.isDialogVisible = false;
        this.isEditing = false;
        this.newTodoText = '';
      },
      saveTodo() {
        if (this.isEditing) {
          this.editingTodo.text = this.newTodoText;
        } else {
          const newTodo = {
            id: Date.now(),
            text: this.newTodoText,
            date: this.selectedDate,
            isCompleted: false
          };
          this.todos.push(newTodo);
        }
        this.closeDialog();
      },
      editTodo(todo) {
        this.isEditing = true;
        this.newTodoText = todo.text;
        this.editingTodo = todo;
        this.isDialogVisible = true;
      },
      // 删除待办事项
      deleteTodo(todo) {
        const index = this.todos.findIndex(t => t.id === todo.id);
        if (index !== -1) {
          this.todos.splice(index, 1);
        }
      }
    }
  };
  </script>
  
  <style scoped>
  .calendar-todolist {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    width: 95%; 
    margin: 10px; 
    margin-left: 5px;
    max-width: 100%;
    padding: 5px;
    margin-top: 40px;
  }

  .calendar {
  box-shadow: rgba(35, 56, 85, 0.15) 0px 20px 40px;
  border-radius: 8px; 
  width:90%;
}
  .header {
    display: flex;
    flex-direction: column;
    width: 100%;
  }
  
  .header h2 {
    margin-top: 50px;
    margin-bottom: 1px;
    margin-left: 30px;
  }
  
  .header h3 {
    margin-top: 10px;
    color: #787878;
    margin-left: 30px;
    margin-bottom: 10px;
  }
  
  .todo-list {
    width: 90%;
    margin-top: -15px;
    max-width: 100%;
  }
  
  .todo-list li {
    display: flex;
    align-items: center;
    justify-content: flex-start;
    /* justify-content: space-between;  */
    padding: 10px 0;
    border-bottom: 1px solid #ccc;
    position: relative;

  }
  
  .todo-list li input[type="checkbox"] {
    width: 25px;
    height: 25px;
    cursor: pointer;
    position: relative;
    margin-right: 20px;
    margin-left: -35px;
  }
  
  .todo-list li .todo-text {
    display: flex;
    align-items: flex-start;
    justify-content: flex-start;
    flex-direction: column;
    flex-grow: 1;
    white-space: nowrap;
    flex-shrink: 0;
  }
  
  .todo-list li .todo-text div {
    color: #333;
    font-size: 17px;
    margin-right: 10px;
    white-space: nowrap;
    font-size: 20px;
  }
  
  .todo-list li .todo-text div.completed-text {
    text-decoration: line-through;
    color: #676767;
  }
  
  .todo-list li .todo-text .date {
    font-size: 12px;
    color: #525252;
    font-size: 18px;
    margin-top: 2px; 
  }
  .todo-list li .button-container {
  display: flex;
  flex-direction: row; 
  align-items: center; 
  margin-left: auto; 
  justify-content: center;
}
  .todo-list li .edit-button {
    background: none;
    border: none;
    cursor: pointer;
    color: #007BFF;
    font-size: 26px;
    font-weight: bolder;
    padding: 0 10px;
  }
  
  .todo-list li .delete-button {
    cursor: pointer;
    width: 20px;
    height: 20px;
  }
  
  .todo-dialog {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999; /* 设置一个高的 z-index 值，确保对话框位于最上层 */
}

.dialog-content {
  background: white;
  padding: 20px;
  border-radius: 10px;
  text-align: center;
  width: 350px;
  z-index: 9999; /* 保证内容区域也在顶层 */
}

  
  input {
    width: 100%;
    margin-bottom: 10px;
    padding: 5px;
}

h2 {
    margin-bottom: 20px;
}

button {
  width: 40%;
  padding: 10px;
  border: none;
  cursor: pointer;
  font-size: 16px;
}

button:first-child {
  margin-right: 10px; 
}


button:last-child {
  background-color: #6e8bea; 
  color: white;
  margin-left: 15px;
}
  </style>
  