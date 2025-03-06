<template>
  <div class="calendar-todolist">
    <!-- FullCalendar -->
    <FullCalendar 
      :options="calendarOptions" 
      :locale="zhCnLocale"
      @dateClick="handleDateClick" 
      class="calendar"
    />

    <!-- To-Do List Section -->
    <div class="todo-list">
      <h2>待办事项</h2>
      <h3>点击日历上的日期即可新建该天的待办事项噢</h3>
      <ul>
        <li v-for="(todo, index) in displayedTodos" :key="todo.id">
          <input type="checkbox" v-model="todo.isCompleted" class="checkbox" @change="updateTodo(todo)"/>

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

<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import FullCalendar from '@fullcalendar/vue3';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import zhCnLocale from '@fullcalendar/core/locales/zh-cn';
import { useStore } from 'vuex';
//   import { showSnackBar } from '../utils/utils.js'; // 不需要导入 showSnackBar，直接使用 ElMessage
import { ElMessage } from 'element-plus'; // 导入 ElMessage


const store = useStore();

// State variables
const selectedDate = ref('');
const newTodoText = ref('');
const isEditing = ref(false);
const editingTodo = ref(null);
const isDialogVisible = ref(false);

const user = computed(() => store.state.user);
const userTodoList = ref([]);

// 使用watch监听用户的变化
watch(user, (newUser) => {
if (newUser && newUser.todolist) {
  userTodoList.value = newUser.todolist;
  console.log("userTodolist updated", userTodoList.value);

}
}, { immediate: true });



// 计算属性：根据 selectedDate 过滤待办事项
const displayedTodos = computed(() => {
  if (!selectedDate.value) {
    return userTodoList.value; // 如果未选择日期，则显示所有待办事项
  }
  return userTodoList.value.filter(todo => todo.date === selectedDate.value);
});


// Calendar options
const calendarOptions = computed(() => ({
  plugins: [dayGridPlugin, interactionPlugin],
  locale: zhCnLocale,
  height: 'auto',
  contentHeight: 'auto',
  minWidth: '300px',
  maxWidth: '1000px',
  height: '480px',
  contentHeight: '800px',
  buttonText: {
    today: '今天',
    month: '月',
  },
  initialView: 'dayGridMonth',
  dateClick: handleDateClick,
  headerToolbar: {
    left: 'prev,next today',
    center: 'title',
    right: ''
  }
}));

// Methods
const handleDateClick = (info) => {
  selectedDate.value = info.dateStr;
  openAddTodoDialog();
};

const openAddTodoDialog = () => {
  isDialogVisible.value = true;
  isEditing.value = false;
  newTodoText.value = '';
};

const closeDialog = () => {
  isDialogVisible.value = false;
  isEditing.value = false;
  newTodoText.value = '';
  editingTodo.value = null;
};

  const saveTodo = async () => {
      if (!user.value || !user.value.uid) {
          ElMessage.warning('用户未登录，无法保存待办事项'); // 使用 ElMessage
          return;
      }

      if (isEditing.value) {
          try{
              await store.dispatch('updateTodoItem', { ...editingTodo.value, text: newTodoText.value });
              ElMessage.success('待办事项已更新');
          }
          catch(error){
               ElMessage.error('更新失败:'+error.message);
          }
      } else {
          const newTodo = {
              id: Date.now(),
              text: newTodoText.value,
              date: selectedDate.value,
              isCompleted: false
          };
      try{
          await store.dispatch('addTodo', newTodo);
          ElMessage.success('待办事项已添加'); // 使用 ElMessage
      }catch(error){
          ElMessage.error('添加失败：'+error.message);
      }

      }
      closeDialog();
  };

  const editTodo = (todo) => {
      isEditing.value = true;
      newTodoText.value = todo.text;
      editingTodo.value = todo;
      isDialogVisible.value = true;
  };

const deleteTodo = async (todo) => {
  try{
       await store.dispatch('deleteTodoItem', todo.id);
        ElMessage.success('待办事项已删除');
  }
  catch(error){
       ElMessage.error("删除失败："+error.message);
  }
};

const updateTodo =async (todo) => {
  try{
     await store.dispatch('updateTodoItem', todo);
  }catch(error){
       ElMessage.error('更新失败：'+error.message);
       todo.isCompleted = !todo.isCompleted; // 恢复状态

  }
 
};

</script>

<style scoped>
/* 样式保持不变 */
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
/* box-shadow: rgba(35, 56, 85, 0.15) 0px 20px 40px; */
box-shadow: var(--global-box-shadow); /* 应用全局边框阴影 */
border-radius: 8px; 
width:90%;
}

.todo-list h2 {
  margin-top: 10px;
  margin-bottom: 1px;
  margin-left: 0px;
  font-size: 20px;
}

.todo-list h3 {
  margin-top: 10px;
  color: var(--text-color);
  margin-left: 0px;
  margin-bottom: 10px;
  font-size: 16px;
}

.todo-list {
  width: 90%;
  margin-top: 15px;
  max-width: 100%;
  padding: 20px;
  border-radius: 10px;
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
  color: var(--text-color);
  font-size: 17px;
  margin-right: 10px;
  white-space: nowrap;
  font-size: 18px;
}

.todo-list li .todo-text div.completed-text {
  text-decoration: line-through;
  color: var(--text-color);
}

.todo-list li .todo-text .date {
  font-size: 12px;
  color: var(--text-color);
  font-size: 16px;
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
  color: var(--text-color);
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

@media (max-width: 768px) {
  .calendar-todolist {
    margin-top: 20px;
    padding: 10px;
  }

  .calendar {
    width: 100%;
    height: 400px;
    margin-bottom: 15px;
  }

  .todo-list {
    width: 100%;
    padding: 15px;
  }

  .todo-list li {
    flex-direction: row; /* 恢复为水平排列 */
    align-items: center;
    gap: 8px;
  }

  .todo-list li .todo-text {
    flex-direction: column;
    align-items: flex-start;
  }

  .todo-dialog {
    padding: 10px;
  }

  .dialog-content {
    width: 90%;
    padding: 15px;
  }

  input[type="checkbox"] {
    margin-left: 0;
  }

  .button-container {
    margin-top: 0; /* 调整按钮容器的上边距 */
    width: auto; /* 调整按钮容器的宽度 */
    justify-content: center;
  }

  button {
    width: 45%;
    font-size: 14px;
  }
}

@media (max-width: 480px) {
  .calendar-todolist {
    margin-top: 10px;
  }

  .calendar {
    height: 300px;
  }

  .header h2 {
    font-size: 20px;
    margin-top: 20px;
  }

  .header h3 {
    font-size: 14px;
    margin-left: 15px;
  }

  .todo-list li .todo-text div {
    font-size: 16px;
  }

  .todo-list li .date {
    font-size: 12px;
  }

  .edit-button {
    font-size: 20px;
  }

  .delete-button {
    width: 16px;
    height: 16px;
  }

  .dialog-content {
    width: 95%;
  }

  input {
    font-size: 14px;
  }

  button {
    padding: 8px;
    font-size: 14px;
  }
}
</style>
