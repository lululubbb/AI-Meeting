<template>
  <div class="calendar-todolist">
    <!-- FullCalendar -->
    <FullCalendar 
      ref="calendarRef"
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
            <div :class="{'completed-text': todo.isCompleted}">{{ todo.text || todo.title}}</div>
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

            <!-- 编辑对话框 -->
        <div v-if="isDialogVisible" class="todo-dialog">
        <div class="dialog-content">
          <h3>{{ isEditing ? '编辑' : '新建' }}待办事项</h3>
          <input v-model="newTodoText" placeholder="输入待办事项"  @keyup.enter="saveTodo"/>
    <div class="dialog-actions"> <!-- 新增操作按钮容器 -->
      <button @click="saveTodo">{{ isEditing ? '保存' : '添加' }}</button>
      <button @click="closeDialog">取消</button>
    </div>
        </div>
      </div>
  </div>


</template>

<script setup>
import { ref, computed, watch, onMounted, nextTick } from 'vue';
import FullCalendar from '@fullcalendar/vue3';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import zhCnLocale from '@fullcalendar/core/locales/zh-cn';
import { useStore } from 'vuex';
import { ElMessage } from 'element-plus'; // 导入 ElMessage


const store = useStore();

// State variables
const selectedDate = ref('');
const newTodoText = ref('');
const isEditing = ref(false);
const editingTodo = ref(null);
const isDialogVisible = ref(false);
const calendarRef = ref(null); 
const user = computed(() => store.state.user);
const userTodoList = computed(() => store.getters.getTodoList);
/*
// 监听 userTodoList 变化，并更新日历事件
watch(userTodoList, () => {
  refreshCalendarEvents();
}, { deep: true });

/*
// 使用watch监听用户的变化
watch(user, (newUser) => {
if (newUser && newUser.todolist) {
  userTodoList.value = newUser.todolist;
  console.log("userTodolist updated", userTodoList.value);

}
}, { immediate: true });
*/
// Calendar.vue 修改watch部分
watch(user, (newUser) => {
  if (newUser && newUser.uid) {
    // 不需要手动更新，因为监听会自动处理
    // 保留调试日志
    userTodoList.value = newUser.todolist;
    console.log("User changed, current uid:", newUser.uid);
  } else {
    userTodoList.value = [];
  }
}, { immediate: true });

// 计算属性：根据 selectedDate 过滤待办事项
const displayedTodos = computed(() => {
  let todos = [];
  if (!selectedDate.value) {
    todos = [...userTodoList.value];
  } else {
    todos = userTodoList.value.filter(todo => todo.date === selectedDate.value);
  }
  return todos.sort((a, b) => {
    // 先按完成状态排序，未完成的在前
    if (a.isCompleted !== b.isCompleted) {
      return a.isCompleted ? 1 : -1;
    }
    // 按日期排序，日期早的在前
    return new Date(a.date) - new Date(b.date);
  });
});

// 新增：获取对应日期的待办事项文本
const getDateTodosText = (dateStr) => {
  return userTodoList.value
    .filter(todo => todo.date === dateStr)
    .map(todo => todo.text || todo.title)
    .join('\n');
};


// Calendar options
const calendarOptions = computed(() => ({
  plugins: [dayGridPlugin, interactionPlugin],
  locale: zhCnLocale,
  height: 'auto',
  contentHeight: 'auto',
  minWidth: '300px',
  maxWidth: '1000px',
  height: '450px',
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
  },
  timeZone: 'UTC',
  events: userTodoList.value.map(todo => ({
    title: [(todo.text || ''), (todo.title || '')].filter(Boolean).join('\n'),
    //start: todo.date,
    start: todo.date + 'T00:00:00', // 明确指定时间
    allDay: true,
    display: 'block', // 确保全天事件正确显示
    display: 'background',
    
  })),

  
  dateClick: (info) => {
    // 使用UTC日期
    selectedDate.value = info.date.toISOString().split('T')[0];
    openAddTodoDialog();
  },
  eventDataTransform: (eventData) => {
    // 强制转换为UTC时间
    return {
      ...eventData,
      start: new Date(eventData.start + 'T00:00:00Z'),
      end: new Date(eventData.start + 'T23:59:59Z')
    };
  },
  /*
  dayCellContent: (args) => {
    // 原始日期数字
    const dayNumber = document.createElement('div');
    dayNumber.innerHTML = args.dayNumberText;
   
    
    // 自定义内容容器
  const container = document.createElement('div');
  container.style.display = 'flex';
  container.style.flexDirection = 'column';
  container.style.alignItems = 'flex-start';
  container.style.padding = '2px';
    
    // 日期数字
    container.appendChild(dayNumber);
    
    // 待办事项文本
    const dateStr = args.date.toISOString().split('T')[0];
    const todosText = getDateTodosText(dateStr);
    
    if (todosText) {
      const todosDiv = document.createElement('div');
      todosDiv.style.fontSize = '0.85em';
    todosDiv.style.color = '#fff'; // 白色文字
    todosDiv.style.backgroundColor = '#bbc1e5'; // 紫色背景
    todosDiv.style.padding = '2px 4px';
    todosDiv.style.borderRadius = '4px'; // 圆角边框
    todosDiv.style.marginTop = '3px';
    todosDiv.style.lineHeight = '1.2';
    //todosDiv.style.maxHeight = '3em'; // 限制最大高度，避免溢出
    //todosDiv.style.overflow = 'hidden';
    todosDiv.style.textOverflow = 'ellipsis';
    //todosDiv.style.whiteSpace = 'nowrap'; // 避免文字过长换行
    todosDiv.style.whiteSpace = 'pre-line'; // 允许换行显示
    todosDiv.style.wordBreak = 'break-word'; // 长文本自动换行
    todosDiv.innerHTML = todosText;
    
    container.appendChild(todosDiv);
    }
    
    return { domNodes: [container] };
  },
}));
*/

dayCellContent: (args) => {
  const dateStr = args.date.toISOString().split('T')[0];
  const todos = userTodoList.value.filter(todo => todo.date === dateStr);

  // 创建主容器
  const container = document.createElement('div');
  container.style.display = 'flex';
  container.style.flexDirection = 'column';
  container.style.gap = '2px'; // 项目间距

  // 日期数字容器
  const dateContainer = document.createElement('div');
  dateContainer.style.display = 'flex';
  dateContainer.style.justifyContent = 'flex-end'; // 日期右对齐

  const dayNumber = document.createElement('div');
  dayNumber.innerHTML = args.dayNumberText;
  dayNumber.className = 'calendar-date-number'; // 添加class
  
  dateContainer.appendChild(dayNumber);
  container.appendChild(dateContainer);

  // 事件容器
  const eventsContainer = document.createElement('div');
  eventsContainer.style.display = 'flex';
  eventsContainer.style.flexDirection = 'column';
  eventsContainer.style.gap = '2px';

  // 为每个事件创建独立框
  todos.forEach(todo => {
    const eventDiv = document.createElement('div');
    eventDiv.className = 'purple-event-box'; // 添加样式类
    eventDiv.textContent = todo.text || todo.title;

     // 根据 isCompleted 添加样式类
    if (todo.isCompleted) {
      eventDiv.style.textDecoration = 'line-through'; // 添加删除线
    } else {
      eventDiv.style.textDecoration = 'none'; // 移除删除线
    }

    eventsContainer.appendChild(eventDiv);
  });

  container.appendChild(eventsContainer);
  
  return { domNodes: [container] };
},
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
              ElMessage.error('更新失败');
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
          ElMessage.error('添加失败');
      }

      }
      closeDialog();
      selectedDate.value = '' // 清空日期筛选
  await nextTick() // 等待DOM更新
  if (calendarRef.value) {
    calendarRef.value.getApi().refetchEvents()
  }
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
       ElMessage.error("删除失败");
  }
};

const updateTodo =async (todo) => {
  try{
    await store.dispatch('updateTodoItem', todo);

  }catch(error){
      ElMessage.error('更新失败');
      todo.isCompleted = !todo.isCompleted; // 恢复状态
       // 强制重新渲染列表
    await nextTick();
 }
};

</script>

<style scoped>
/* 日历事件删除线样式 */
:deep(.fc-event-title) {
  text-decoration: none !important; /* 重置默认样式 */
}

:deep(.completed-event) {
  text-decoration: line-through !important;
  opacity: 0.6 !important;
}
/* 紫色事件框样式 */
:deep(.purple-event-box) {
  background: #b9c0e4;
  color: white !important;
  padding: 3px 6px;
  border-radius: 4px;
  font-size: 0.8em;
  line-height: 1.2;
  word-break: break-word;
  white-space: normal !important;
  cursor: pointer;
  transition: opacity 0.2s;
  font-size: 0.85em !important; /* 调整数字改变大小 */
  transition: text-decoration 0.3s; /* 平滑过渡效果 */
}
/* 样式保持不变 */
.calendar-todolist {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 95%; 
  margin-left: 5px;
  max-width: 100%;
  padding: 5px;
  margin-top: 30px;
}

.calendar {
/* box-shadow: rgba(35, 56, 85, 0.15) 0px 20px 40px; */
box-shadow: var(--global-box-shadow); /* 应用全局边框阴影 */
border-radius: 8px; 
width:90%;
font-size: 14px;
}

.todo-list h2 {
  margin-top: 0px;
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
  font-weight: 520;
}

.todo-list {
  width: 90%;
  margin-top: 15px;
  max-width: 100%;
  padding: 20px;
  border-radius: 10px;
  max-height: 380px;  /* 新增最大高度限制 */
  scrollbar-width: thin;  /* 现代浏览器滚动条优化 */
  scrollbar-color: #eeeeef rgba(242, 242, 242, 0.1); 
  overflow-y: auto;  
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
  font-size: 18px;
}

.todo-list li .todo-text div {
  color: var(--text-color);
  font-size: 17px;
  margin-right: 10px;
  white-space: nowrap;
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


.button-container {
  display: flex;
  align-items: center;
  gap: 10px;
}

.edit-button {
  background-color: transparent;
  border: none;
  font-size: 20px;
  font-weight: bold;
  cursor: pointer;
}

.delete-button {
  width: 20px;
  height: 20px;
  cursor: pointer;
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

.dialog-content h3 {
  margin-bottom: 10px;
  text-align: center;
}

.dialog-actions {
  display: flex;
  gap: 50px; /* 按钮间距 */
  justify-content:center; /* 按钮右对齐 */
}

.dialog-actions button {
  padding: 10px 25px;
  border-radius: 6px;
  transition: all 0.3s;
  flex: 1; /* 等宽按钮 */
  max-width: 120px; /* 限制最大宽度 */
  background-color: #b9ddfe;
  border: solid 1px #95cbfe;
  color: #000000;
  cursor: pointer;
}

button:hover {
  background-color: #84befd;
  transform: translateY(-5px); 
}
input {
  width: 95%;
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

  .dialog-actions {
    gap: 15px;
    flex-direction: column; /* 移动端改为垂直排列 */
  }

  .dialog-actions button {
    max-width: 100%;
    width: 100%;
    padding: 12px;
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

  .dialog-actions button {
    font-size: 14px;
  }

  input {
    font-size: 14px;
  }

  button {
    padding: 8px;
    font-size: 14px;
  }
  /* 添加/修改以下样式 */
:deep(.fc-daygrid-day-top) {
  flex-direction: row-reverse !important; /* 强制反向排列 */
  justify-content: flex-start !important; /* 日期靠右 */
  width: 100%;
}

:deep(.fc-daygrid-day-number) {
  margin-left: auto !important; /* 推至最右侧 */
  padding: 2px 4px !important;
}

/* 日期数字样式 */
:deep(.calendar-date-number) {
  background: #f0f0f0;
  border-radius: 12px;
  padding: 2px 6px !important;
  font-weight: bold;
  margin: 2px !important;
}



/* 调整日历网格高度 */
:deep(.fc-daygrid-day-frame) {
  min-height: 90px !important;
  padding: 2px !important;
}

}
</style>
