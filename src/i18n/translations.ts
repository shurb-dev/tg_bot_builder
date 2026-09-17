export type AppLocale = "ru" | "en";

type DeepStrings<T> = { [K in keyof T]: T[K] extends string ? string : DeepStrings<T[K]> };

const enBase = {
  app: { name: "TFlow" },
  nav: { design: "Design", flow: "Flow", code: "Code" },
  language: { label: "Application language", english: "English", russian: "Русский" },
  header: {
    projectName: "Project name", valid: "Valid", errors: "{count} errors", warnings: "{count} warnings",
    newProject: "New project", importProject: "Import project", exportJson: "Export JSON", exportZip: "Export aiogram ZIP", save: "Save now", reset: "Reset to demo",
  },
  sidebar: {
    project: "Project", botSettings: "Bot settings", screens: "Screens", total: "{count} total", create: "Create screen", add: "Add screen", unnamed: "Unnamed screen", noTrigger: "No trigger", buttons: "{count} buttons", duplicate: "Duplicate screen", delete: "Delete screen",
  },
  design: { preview: "Telegram preview", noScreen: "No screen selected", noScreenHint: "Select a screen or create a new one.", create: "Create screen", messageTab: "Message", inlineTab: "Inline keyboard", bottomTab: "Bottom keyboard" },
  message: { title: "Message", hint: "Edit the selected screen message.", text: "Message text", parseMode: "Parse mode", photoUrl: "Photo URL", optional: "optional", invalidUrl: "Use a valid HTTP/HTTPS URL." },
  inline: { title: "Inline keyboard", hint: "Drag buttons between rows", row: "Row", button: "Button", addFirst: "+ Add first button", drop: "Drop button here", reorderRow: "Reorder row", deleteRow: "Delete row", untitled: "Untitled", drag: "Drag {text}" },
  reply: {
    title: "Bottom keyboard", hint: "Telegram reply keyboard shown near the message input.", mode: "Bottom keyboard mode", inherit: "Keep current keyboard", show: "Show keyboard", remove: "Hide keyboard", resize: "Resize keyboard", persistent: "Persistent", oneTime: "One time", selective: "Selective", placeholder: "Input placeholder", placeholderExample: "Type a message...", row: "Row", button: "Button", addFirst: "+ Add first bottom button", drop: "Drop button here", reorderRow: "Reorder bottom row", deleteRow: "Delete bottom row", drag: "Drag reply {text}", emptyInherited: "This screen keeps the keyboard from the previous screen.", emptyRemoved: "This screen hides the current bottom keyboard." },
  properties: {
    select: "Select a screen or button to edit its properties.", screenTitle: "Screen properties", screenHint: "Message and entry trigger", screenName: "Screen name", commandTrigger: "Command trigger", optional: "optional", messageText: "Message text", parseMode: "Parse mode", photoUrl: "Photo URL", inlineTitle: "Inline button properties", replyTitle: "Bottom button properties", buttonText: "Button text", actionType: "Action type", goToScreen: "Go to screen", callback: "Callback", url: "URL", targetScreen: "Target screen", callbackData: "Callback data", callbackError: "Telegram callback_data must be 1–64 UTF-8 bytes.", urlError: "Use a valid HTTP/HTTPS URL.", webAppError: "Web App URL must use HTTPS.", deleteButton: "Delete button", sendText: "Send text", requestContact: "Request contact", requestLocation: "Request location", webApp: "Open Web App" },
  botSettings: {
    title: "Bot settings", hint: "Telegram command menu and chat menu button.", commands: "Commands", addCommand: "Add command", command: "Command", description: "Description", deleteCommand: "Delete command", menuButton: "Menu button", commandsMenu: "Commands", defaultMenu: "Default", webAppMenu: "Web App", menuText: "Button text", menuUrl: "Web App URL", webAppHttps: "Telegram Web Apps require HTTPS." },
  preview: { bot: "bot", mediaAlt: "Message media preview", imageFailed: "Image could not be loaded", emptyMessage: "Empty message", noInline: "No inline keyboard", inherited: "Keyboard inherited", removed: "Bottom keyboard hidden", messagePlaceholder: "Message" },
  validation: { title: "Project validation", summary: "{errors} errors · {warnings} warnings", close: "Close validation", clean: "No validation issues. Project is ready to export." },
  code: { files: "Generated files", blocked: "Code generation is blocked by validation errors.", blockedHint: "Fix project errors, then Code mode will update automatically.", copy: "Copy", copied: "Copied" },
  flow: { emptyMessage: "Empty message" },
  toast: { projectSaved: "Project saved", jsonExported: "JSON exported", jsonExportFailed: "JSON export failed", importBlocked: "Import blocked: {count} validation error(s)", projectImported: "Project imported", importFailed: "Project import failed", zipExported: "aiogram project exported", zipFailed: "ZIP export failed" },
  confirm: { newProject: "Create a new project? Your current project is autosaved locally.", reset: "Reset the active project to the demo project?", replace: "Replace the active project with “{name}”?", deleteScreen: "Delete “{name}”?", deleteReferenced: " {count} referencing button(s) will also be removed." },
  shell: { loading: "Loading local project…", recovery: "Stored project could not be loaded. A backup was preserved.", desktop: "This editor is optimized for desktop widths of 1280px and above.", dismiss: "Dismiss" },
} as const;

export type TranslationSchema = DeepStrings<typeof enBase>;
export const en: TranslationSchema = enBase;

export const ru: TranslationSchema = {
  app: { name: "TFlow" },
  nav: { design: "Дизайн", flow: "Сценарий", code: "Код" },
  language: { label: "Язык приложения", english: "English", russian: "Русский" },
  header: { projectName: "Название проекта", valid: "Без ошибок", errors: "Ошибок: {count}", warnings: "Предупреждений: {count}", newProject: "Новый проект", importProject: "Импорт проекта", exportJson: "Экспорт JSON", exportZip: "Экспорт aiogram ZIP", save: "Сохранить", reset: "Сбросить к демо" },
  sidebar: { project: "Проект", botSettings: "Настройки бота", screens: "Экраны", total: "Всего: {count}", create: "Создать экран", add: "Добавить экран", unnamed: "Безымянный экран", noTrigger: "Без команды", buttons: "Кнопок: {count}", duplicate: "Дублировать экран", delete: "Удалить экран" },
  design: { preview: "Предпросмотр Telegram", noScreen: "Экран не выбран", noScreenHint: "Выберите экран или создайте новый.", create: "Создать экран", messageTab: "Сообщение", inlineTab: "Inline-клавиатура", bottomTab: "Нижняя клавиатура" },
  message: { title: "Сообщение", hint: "Редактирование сообщения выбранного экрана.", text: "Текст сообщения", parseMode: "Режим разметки", photoUrl: "URL изображения", optional: "необязательно", invalidUrl: "Укажите корректный HTTP/HTTPS URL." },
  inline: { title: "Inline-клавиатура", hint: "Перетаскивайте кнопки между строками", row: "Строка", button: "Кнопка", addFirst: "+ Добавить первую кнопку", drop: "Перетащите кнопку сюда", reorderRow: "Переместить строку", deleteRow: "Удалить строку", untitled: "Без названия", drag: "Перетащить {text}" },
  reply: { title: "Нижняя клавиатура", hint: "Reply-клавиатура Telegram возле поля ввода.", mode: "Режим нижней клавиатуры", inherit: "Оставить текущую", show: "Показать клавиатуру", remove: "Скрыть клавиатуру", resize: "Подгонять размер", persistent: "Постоянная", oneTime: "Одноразовая", selective: "Выборочная", placeholder: "Подсказка поля ввода", placeholderExample: "Введите сообщение...", row: "Строка", button: "Кнопка", addFirst: "+ Добавить первую нижнюю кнопку", drop: "Перетащите кнопку сюда", reorderRow: "Переместить нижнюю строку", deleteRow: "Удалить нижнюю строку", drag: "Перетащить нижнюю кнопку {text}", emptyInherited: "Этот экран сохраняет клавиатуру предыдущего экрана.", emptyRemoved: "Этот экран скрывает текущую нижнюю клавиатуру." },
  properties: { select: "Выберите экран или кнопку для редактирования свойств.", screenTitle: "Свойства экрана", screenHint: "Сообщение и команда входа", screenName: "Название экрана", commandTrigger: "Команда", optional: "необязательно", messageText: "Текст сообщения", parseMode: "Режим разметки", photoUrl: "URL изображения", inlineTitle: "Свойства inline-кнопки", replyTitle: "Свойства нижней кнопки", buttonText: "Текст кнопки", actionType: "Действие", goToScreen: "Перейти на экран", callback: "Callback", url: "URL", targetScreen: "Целевой экран", callbackData: "Callback data", callbackError: "Telegram callback_data должен занимать 1–64 байта UTF-8.", urlError: "Укажите корректный HTTP/HTTPS URL.", webAppError: "URL Web App должен использовать HTTPS.", deleteButton: "Удалить кнопку", sendText: "Отправить текст", requestContact: "Запросить контакт", requestLocation: "Запросить геолокацию", webApp: "Открыть Web App" },
  botSettings: { title: "Настройки бота", hint: "Меню команд Telegram и кнопка меню чата.", commands: "Команды", addCommand: "Добавить команду", command: "Команда", description: "Описание", deleteCommand: "Удалить команду", menuButton: "Кнопка меню", commandsMenu: "Команды", defaultMenu: "По умолчанию", webAppMenu: "Web App", menuText: "Текст кнопки", menuUrl: "URL Web App", webAppHttps: "Telegram Web Apps требуют HTTPS." },
  preview: { bot: "бот", mediaAlt: "Предпросмотр изображения сообщения", imageFailed: "Не удалось загрузить изображение", emptyMessage: "Пустое сообщение", noInline: "Нет inline-клавиатуры", inherited: "Клавиатура наследуется", removed: "Нижняя клавиатура скрыта", messagePlaceholder: "Сообщение" },
  validation: { title: "Проверка проекта", summary: "Ошибок: {errors} · предупреждений: {warnings}", close: "Закрыть проверку", clean: "Ошибок проверки нет. Проект готов к экспорту." },
  code: { files: "Сгенерированные файлы", blocked: "Генерация кода заблокирована ошибками проверки.", blockedHint: "Исправьте ошибки проекта — код обновится автоматически.", copy: "Копировать", copied: "Скопировано" },
  flow: { emptyMessage: "Пустое сообщение" },
  toast: { projectSaved: "Проект сохранён", jsonExported: "JSON экспортирован", jsonExportFailed: "Не удалось экспортировать JSON", importBlocked: "Импорт заблокирован: ошибок — {count}", projectImported: "Проект импортирован", importFailed: "Не удалось импортировать проект", zipExported: "Проект aiogram экспортирован", zipFailed: "Не удалось экспортировать ZIP" },
  confirm: { newProject: "Создать новый проект? Текущий проект автоматически сохранён локально.", reset: "Сбросить активный проект к демо-версии?", replace: "Заменить активный проект на «{name}»?", deleteScreen: "Удалить «{name}»?", deleteReferenced: " Также будут удалены связанные кнопки: {count}." },
  shell: { loading: "Загрузка локального проекта…", recovery: "Сохранённый проект не удалось загрузить. Резервная копия сохранена.", desktop: "Редактор оптимизирован для экранов шириной от 1280 px.", dismiss: "Закрыть" },
};

export const dictionaries: Record<AppLocale, TranslationSchema> = { en, ru };

export function getTranslations(locale: AppLocale): TranslationSchema {
  return dictionaries[locale];
}

export function formatTemplate(template: string, params: Record<string, string | number> = {}): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => String(params[key] ?? `{${key}}`));
}
