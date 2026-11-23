import type {} from '@deepseek-ai/dsh-client-ui-slots'

export const NS = 'dsh-background-jobs-sidebar'

export const LABELS = {
  en: {
    heading: 'Background jobs', loading: 'Connecting…', unavailable: 'Job list unavailable',
    running: 'Running', stopping: 'Stopping', unowned: 'Shared job',
  },
  zh: {
    heading: '后台任务', loading: '正在连接…', unavailable: '暂时无法读取任务',
    running: '运行中', stopping: '正在停止', unowned: '共享任务',
  },
  ja: {
    heading: 'バックグラウンドタスク', loading: '接続中…', unavailable: 'タスク一覧を取得できません',
    running: '実行中', stopping: '停止中', unowned: '共有タスク',
  },
  de: {
    heading: 'Hintergrundaufgaben', loading: 'Verbindung wird hergestellt…', unavailable: 'Aufgabenliste nicht verfügbar',
    running: 'Läuft', stopping: 'Wird gestoppt', unowned: 'Geteilte Aufgabe',
  },
  es: {
    heading: 'Tareas en segundo plano', loading: 'Conectando…', unavailable: 'Lista de tareas no disponible',
    running: 'En ejecución', stopping: 'Deteniendo', unowned: 'Tarea compartida',
  },
  fr: {
    heading: 'Tâches en arrière-plan', loading: 'Connexion…', unavailable: 'Liste des tâches indisponible',
    running: 'En cours', stopping: 'Arrêt en cours', unowned: 'Tâche partagée',
  },
  pt: {
    heading: 'Tarefas em segundo plano', loading: 'Conectando…', unavailable: 'Lista de tarefas indisponível',
    running: 'Em execução', stopping: 'Interrompendo', unowned: 'Tarefa compartilhada',
  },
  ru: {
    heading: 'Фоновые задачи', loading: 'Подключение…', unavailable: 'Список задач недоступен',
    running: 'Выполняется', stopping: 'Останавливается', unowned: 'Общая задача',
  },
}

declare module '@deepseek-ai/dsh-client-ui-slots' {
  interface LocaleNamespaceMap {
    [NS]: keyof typeof LABELS.en
  }
}
