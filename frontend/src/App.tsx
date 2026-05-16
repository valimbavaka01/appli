import { useState, useEffect, useCallback } from 'react'
import './App.css'
import {
  LayoutDashboard,
  FolderOpen,
  Plus,
  Pencil,
  Trash2,
  ChevronLeft,
  ClipboardList,
  FileText,
  CheckCircle2,
  Clock,
  AlertCircle,
  X,
  Save,
} from 'lucide-react'

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000'

type MissionStatus = 'planifiee' | 'en_cours' | 'terminee' | 'annulee'
type TaskStatus = 'a_faire' | 'en_cours' | 'terminee'
type TaskPriority = 'basse' | 'moyenne' | 'haute' | 'urgente'
type DocumentStatus = 'brouillon' | 'en_revue' | 'valide'

interface Mission {
  id: number
  titre: string
  description: string | null
  statut: MissionStatus
  date_debut: string | null
  date_fin: string | null
  responsable: string | null
  created_at: string
  updated_at: string
  tasks: Task[]
  documents: MissionDocument[]
  task_count?: number
  document_count?: number
}

interface Task {
  id: number
  mission_id: number
  titre: string
  description: string | null
  statut: TaskStatus
  priorite: TaskPriority
  assignee: string | null
  date_echeance: string | null
  created_at: string
  updated_at: string
}

interface MissionDocument {
  id: number
  mission_id: number
  titre: string
  type_document: string | null
  contenu: string | null
  statut: DocumentStatus
  auteur: string | null
  created_at: string
  updated_at: string
}

interface DashboardStats {
  total_missions: number
  missions_en_cours: number
  missions_terminees: number
  total_tasks: number
  tasks_terminees: number
  tasks_en_cours: number
  total_documents: number
  documents_valides: number
}

const STATUS_LABELS: Record<string, string> = {
  planifiee: 'Planifiée',
  en_cours: 'En cours',
  terminee: 'Terminée',
  annulee: 'Annulée',
  a_faire: 'À faire',
  brouillon: 'Brouillon',
  en_revue: 'En revue',
  valide: 'Validé',
}

const STATUS_COLORS: Record<string, string> = {
  planifiee: 'bg-blue-100 text-blue-800',
  en_cours: 'bg-yellow-100 text-yellow-800',
  terminee: 'bg-green-100 text-green-800',
  annulee: 'bg-gray-100 text-gray-800',
  a_faire: 'bg-slate-100 text-slate-800',
  brouillon: 'bg-orange-100 text-orange-800',
  en_revue: 'bg-purple-100 text-purple-800',
  valide: 'bg-green-100 text-green-800',
}

const PRIORITY_COLORS: Record<string, string> = {
  basse: 'bg-slate-100 text-slate-700',
  moyenne: 'bg-blue-100 text-blue-700',
  haute: 'bg-orange-100 text-orange-700',
  urgente: 'bg-red-100 text-red-700',
}

const PRIORITY_LABELS: Record<string, string> = {
  basse: 'Basse',
  moyenne: 'Moyenne',
  haute: 'Haute',
  urgente: 'Urgente',
}

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[status] || 'bg-gray-100 text-gray-800'}`}>
      {STATUS_LABELS[status] || status}
    </span>
  )
}

function PriorityBadge({ priority }: { priority: string }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${PRIORITY_COLORS[priority] || 'bg-gray-100 text-gray-800'}`}>
      {PRIORITY_LABELS[priority] || priority}
    </span>
  )
}

function StatCard({ title, value, icon }: { title: string; value: number; icon: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="text-3xl font-bold mt-1">{value}</p>
        </div>
        <div className="p-3 rounded-lg bg-gray-50">{icon}</div>
      </div>
    </div>
  )
}

function App() {
  const [page, setPage] = useState<'dashboard' | 'missions'>('dashboard')
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [missions, setMissions] = useState<Mission[]>([])
  const [selectedMission, setSelectedMission] = useState<Mission | null>(null)
  const [showMissionForm, setShowMissionForm] = useState(false)
  const [showTaskForm, setShowTaskForm] = useState(false)
  const [showDocForm, setShowDocForm] = useState(false)
  const [editingMission, setEditingMission] = useState<Mission | null>(null)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [editingDoc, setEditingDoc] = useState<MissionDocument | null>(null)
  const [activeTab, setActiveTab] = useState<'tasks' | 'documents'>('tasks')

  const fetchStats = useCallback(async () => {
    const res = await fetch(`${API}/api/dashboard/`)
    setStats(await res.json())
  }, [])

  const fetchMissions = useCallback(async () => {
    const res = await fetch(`${API}/api/missions/`)
    setMissions(await res.json())
  }, [])

  const fetchMission = useCallback(async (id: number) => {
    const res = await fetch(`${API}/api/missions/${id}`)
    const data = await res.json()
    setSelectedMission(data)
  }, [])

  useEffect(() => {
    fetchStats()
    fetchMissions()
  }, [fetchStats, fetchMissions])

  const handleSaveMission = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = e.currentTarget
    const formData = new FormData(form)
    const data: Record<string, string | null> = {
      titre: formData.get('titre') as string,
      description: formData.get('description') as string || null,
      statut: formData.get('statut') as string,
      responsable: formData.get('responsable') as string || null,
      date_debut: formData.get('date_debut') as string || null,
      date_fin: formData.get('date_fin') as string || null,
    }

    if (editingMission) {
      await fetch(`${API}/api/missions/${editingMission.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
    } else {
      await fetch(`${API}/api/missions/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
    }

    setShowMissionForm(false)
    setEditingMission(null)
    fetchMissions()
    fetchStats()
  }

  const handleDeleteMission = async (id: number) => {
    if (!confirm('Supprimer cette mission ?')) return
    await fetch(`${API}/api/missions/${id}`, { method: 'DELETE' })
    setSelectedMission(null)
    fetchMissions()
    fetchStats()
  }

  const handleSaveTask = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!selectedMission) return
    const form = e.currentTarget
    const formData = new FormData(form)
    const data: Record<string, string | null> = {
      titre: formData.get('titre') as string,
      description: formData.get('description') as string || null,
      statut: formData.get('statut') as string,
      priorite: formData.get('priorite') as string,
      assignee: formData.get('assignee') as string || null,
      date_echeance: formData.get('date_echeance') as string || null,
    }

    if (editingTask) {
      await fetch(`${API}/api/missions/${selectedMission.id}/tasks/${editingTask.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
    } else {
      await fetch(`${API}/api/missions/${selectedMission.id}/tasks/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
    }

    setShowTaskForm(false)
    setEditingTask(null)
    fetchMission(selectedMission.id)
    fetchStats()
  }

  const handleDeleteTask = async (taskId: number) => {
    if (!selectedMission || !confirm('Supprimer cette tâche ?')) return
    await fetch(`${API}/api/missions/${selectedMission.id}/tasks/${taskId}`, { method: 'DELETE' })
    fetchMission(selectedMission.id)
    fetchStats()
  }

  const handleSaveDoc = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!selectedMission) return
    const form = e.currentTarget
    const formData = new FormData(form)
    const data: Record<string, string | null> = {
      titre: formData.get('titre') as string,
      type_document: formData.get('type_document') as string || null,
      contenu: formData.get('contenu') as string || null,
      statut: formData.get('statut') as string,
      auteur: formData.get('auteur') as string || null,
    }

    if (editingDoc) {
      await fetch(`${API}/api/missions/${selectedMission.id}/documents/${editingDoc.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
    } else {
      await fetch(`${API}/api/missions/${selectedMission.id}/documents/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
    }

    setShowDocForm(false)
    setEditingDoc(null)
    fetchMission(selectedMission.id)
    fetchStats()
  }

  const handleDeleteDoc = async (docId: number) => {
    if (!selectedMission || !confirm('Supprimer ce document ?')) return
    await fetch(`${API}/api/missions/${selectedMission.id}/documents/${docId}`, { method: 'DELETE' })
    fetchMission(selectedMission.id)
    fetchStats()
  }

  const formatDate = (d: string | null) => {
    if (!d) return '—'
    return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-6 border-b border-gray-100">
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <ClipboardList className="w-6 h-6 text-indigo-600" />
            MissionDoc
          </h1>
          <p className="text-xs text-gray-500 mt-1">Gestion documentaire</p>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          <button
            onClick={() => { setPage('dashboard'); setSelectedMission(null); fetchStats() }}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${page === 'dashboard' && !selectedMission ? 'bg-indigo-50 text-indigo-700' : 'text-gray-600 hover:bg-gray-50'}`}
          >
            <LayoutDashboard className="w-5 h-5" />
            Tableau de bord
          </button>
          <button
            onClick={() => { setPage('missions'); setSelectedMission(null); fetchMissions() }}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${page === 'missions' || selectedMission ? 'bg-indigo-50 text-indigo-700' : 'text-gray-600 hover:bg-gray-50'}`}
          >
            <FolderOpen className="w-5 h-5" />
            Missions
          </button>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {/* Dashboard Page */}
        {page === 'dashboard' && !selectedMission && (
          <div className="p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Tableau de bord</h2>
            {stats && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard title="Total Missions" value={stats.total_missions} icon={<FolderOpen className="w-6 h-6 text-indigo-600" />} />
                <StatCard title="Missions en cours" value={stats.missions_en_cours} icon={<Clock className="w-6 h-6 text-yellow-600" />} />
                <StatCard title="Missions terminées" value={stats.missions_terminees} icon={<CheckCircle2 className="w-6 h-6 text-green-600" />} />
                <StatCard title="Total Tâches" value={stats.total_tasks} icon={<ClipboardList className="w-6 h-6 text-blue-600" />} />
                <StatCard title="Tâches terminées" value={stats.tasks_terminees} icon={<CheckCircle2 className="w-6 h-6 text-green-600" />} />
                <StatCard title="Tâches en cours" value={stats.tasks_en_cours} icon={<AlertCircle className="w-6 h-6 text-yellow-600" />} />
                <StatCard title="Total Documents" value={stats.total_documents} icon={<FileText className="w-6 h-6 text-purple-600" />} />
                <StatCard title="Documents validés" value={stats.documents_valides} icon={<CheckCircle2 className="w-6 h-6 text-green-600" />} />
              </div>
            )}
          </div>
        )}

        {/* Missions List Page */}
        {page === 'missions' && !selectedMission && (
          <div className="p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Missions</h2>
              <button
                onClick={() => { setEditingMission(null); setShowMissionForm(true) }}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
              >
                <Plus className="w-4 h-4" />
                Nouvelle mission
              </button>
            </div>

            {missions.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-xl border border-gray-100">
                <FolderOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">Aucune mission pour le moment</p>
                <button
                  onClick={() => { setEditingMission(null); setShowMissionForm(true) }}
                  className="mt-4 text-indigo-600 hover:text-indigo-700 text-sm font-medium"
                >
                  Créer votre première mission
                </button>
              </div>
            ) : (
              <div className="grid gap-4">
                {missions.map((m) => (
                  <div
                    key={m.id}
                    className="bg-white rounded-xl border border-gray-100 p-6 hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => { fetchMission(m.id); setActiveTab('tasks') }}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">{m.titre}</h3>
                          <StatusBadge status={m.statut} />
                        </div>
                        {m.description && <p className="text-gray-600 text-sm mb-3">{m.description}</p>}
                        <div className="flex items-center gap-6 text-sm text-gray-500">
                          {m.responsable && <span>Responsable: <strong>{m.responsable}</strong></span>}
                          <span className="flex items-center gap-1"><ClipboardList className="w-4 h-4" /> {m.task_count || 0} tâches</span>
                          <span className="flex items-center gap-1"><FileText className="w-4 h-4" /> {m.document_count || 0} documents</span>
                          <span>{formatDate(m.created_at)}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 ml-4" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => { setEditingMission(m as Mission); setShowMissionForm(true) }}
                          className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteMission(m.id)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Mission Detail Page */}
        {selectedMission && (
          <div className="p-8">
            <button
              onClick={() => { setSelectedMission(null); setPage('missions'); fetchMissions() }}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 text-sm"
            >
              <ChevronLeft className="w-4 h-4" />
              Retour aux missions
            </button>

            <div className="bg-white rounded-xl border border-gray-100 p-6 mb-6">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h2 className="text-2xl font-bold text-gray-900">{selectedMission.titre}</h2>
                    <StatusBadge status={selectedMission.statut} />
                  </div>
                  {selectedMission.description && <p className="text-gray-600 mb-4">{selectedMission.description}</p>}
                  <div className="flex items-center gap-6 text-sm text-gray-500">
                    {selectedMission.responsable && <span>Responsable: <strong>{selectedMission.responsable}</strong></span>}
                    {selectedMission.date_debut && <span>Début: {formatDate(selectedMission.date_debut)}</span>}
                    {selectedMission.date_fin && <span>Fin: {formatDate(selectedMission.date_fin)}</span>}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => { setEditingMission(selectedMission); setShowMissionForm(true) }}
                    className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                  >
                    <Pencil className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleDeleteMission(selectedMission.id)}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-lg w-fit">
              <button
                onClick={() => setActiveTab('tasks')}
                className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'tasks' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
              >
                <ClipboardList className="w-4 h-4" />
                Tâches ({selectedMission.tasks?.length || 0})
              </button>
              <button
                onClick={() => setActiveTab('documents')}
                className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'documents' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
              >
                <FileText className="w-4 h-4" />
                Documents ({selectedMission.documents?.length || 0})
              </button>
            </div>

            {/* Tasks Tab */}
            {activeTab === 'tasks' && (
              <div>
                <div className="flex justify-end mb-4">
                  <button
                    onClick={() => { setEditingTask(null); setShowTaskForm(true) }}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
                  >
                    <Plus className="w-4 h-4" />
                    Nouvelle tâche
                  </button>
                </div>

                {(!selectedMission.tasks || selectedMission.tasks.length === 0) ? (
                  <div className="text-center py-12 bg-white rounded-xl border border-gray-100">
                    <ClipboardList className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 text-sm">Aucune tâche</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {selectedMission.tasks.map((task) => (
                      <div key={task.id} className="bg-white rounded-xl border border-gray-100 p-5">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-1">
                              <h4 className="font-medium text-gray-900">{task.titre}</h4>
                              <StatusBadge status={task.statut} />
                              <PriorityBadge priority={task.priorite} />
                            </div>
                            {task.description && <p className="text-gray-600 text-sm mb-2">{task.description}</p>}
                            <div className="flex items-center gap-4 text-xs text-gray-500">
                              {task.assignee && <span>Assigné à: {task.assignee}</span>}
                              {task.date_echeance && <span>Échéance: {formatDate(task.date_echeance)}</span>}
                            </div>
                          </div>
                          <div className="flex gap-1 ml-4">
                            <button onClick={() => { setEditingTask(task); setShowTaskForm(true) }} className="p-1.5 text-gray-400 hover:text-indigo-600 rounded">
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button onClick={() => handleDeleteTask(task.id)} className="p-1.5 text-gray-400 hover:text-red-600 rounded">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Documents Tab */}
            {activeTab === 'documents' && (
              <div>
                <div className="flex justify-end mb-4">
                  <button
                    onClick={() => { setEditingDoc(null); setShowDocForm(true) }}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
                  >
                    <Plus className="w-4 h-4" />
                    Nouveau document
                  </button>
                </div>

                {(!selectedMission.documents || selectedMission.documents.length === 0) ? (
                  <div className="text-center py-12 bg-white rounded-xl border border-gray-100">
                    <FileText className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 text-sm">Aucun document</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {selectedMission.documents.map((doc: MissionDocument) => (
                      <div key={doc.id} className="bg-white rounded-xl border border-gray-100 p-5">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-1">
                              <h4 className="font-medium text-gray-900">{doc.titre}</h4>
                              <StatusBadge status={doc.statut} />
                              {doc.type_document && (
                                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">{doc.type_document}</span>
                              )}
                            </div>
                            {doc.contenu && <p className="text-gray-600 text-sm mb-2 line-clamp-2">{doc.contenu}</p>}
                            <div className="flex items-center gap-4 text-xs text-gray-500">
                              {doc.auteur && <span>Auteur: {doc.auteur}</span>}
                              <span>{formatDate(doc.created_at)}</span>
                            </div>
                          </div>
                          <div className="flex gap-1 ml-4">
                            <button onClick={() => { setEditingDoc(doc); setShowDocForm(true) }} className="p-1.5 text-gray-400 hover:text-indigo-600 rounded">
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button onClick={() => handleDeleteDoc(doc.id)} className="p-1.5 text-gray-400 hover:text-red-600 rounded">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Mission Form Modal */}
        {showMissionForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => { setShowMissionForm(false); setEditingMission(null) }}>
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4 p-6" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold">{editingMission ? 'Modifier la mission' : 'Nouvelle mission'}</h3>
                <button onClick={() => { setShowMissionForm(false); setEditingMission(null) }} className="p-1 text-gray-400 hover:text-gray-600 rounded">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleSaveMission} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Titre *</label>
                  <input name="titre" required defaultValue={editingMission?.titre || ''} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea name="description" rows={3} defaultValue={editingMission?.description || ''} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Statut</label>
                    <select name="statut" defaultValue={editingMission?.statut || 'planifiee'} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent">
                      <option value="planifiee">Planifiée</option>
                      <option value="en_cours">En cours</option>
                      <option value="terminee">Terminée</option>
                      <option value="annulee">Annulée</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Responsable</label>
                    <input name="responsable" defaultValue={editingMission?.responsable || ''} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date début</label>
                    <input name="date_debut" type="date" defaultValue={editingMission?.date_debut?.split('T')[0] || ''} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date fin</label>
                    <input name="date_fin" type="date" defaultValue={editingMission?.date_fin?.split('T')[0] || ''} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent" />
                  </div>
                </div>
                <div className="flex justify-end gap-3 pt-4">
                  <button type="button" onClick={() => { setShowMissionForm(false); setEditingMission(null) }} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800">Annuler</button>
                  <button type="submit" className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium">
                    <Save className="w-4 h-4" />
                    {editingMission ? 'Modifier' : 'Créer'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Task Form Modal */}
        {showTaskForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => { setShowTaskForm(false); setEditingTask(null) }}>
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4 p-6" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold">{editingTask ? 'Modifier la tâche' : 'Nouvelle tâche'}</h3>
                <button onClick={() => { setShowTaskForm(false); setEditingTask(null) }} className="p-1 text-gray-400 hover:text-gray-600 rounded">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleSaveTask} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Titre *</label>
                  <input name="titre" required defaultValue={editingTask?.titre || ''} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea name="description" rows={3} defaultValue={editingTask?.description || ''} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Statut</label>
                    <select name="statut" defaultValue={editingTask?.statut || 'a_faire'} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent">
                      <option value="a_faire">À faire</option>
                      <option value="en_cours">En cours</option>
                      <option value="terminee">Terminée</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Priorité</label>
                    <select name="priorite" defaultValue={editingTask?.priorite || 'moyenne'} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent">
                      <option value="basse">Basse</option>
                      <option value="moyenne">Moyenne</option>
                      <option value="haute">Haute</option>
                      <option value="urgente">Urgente</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Assigné à</label>
                    <input name="assignee" defaultValue={editingTask?.assignee || ''} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Échéance</label>
                    <input name="date_echeance" type="date" defaultValue={editingTask?.date_echeance?.split('T')[0] || ''} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent" />
                  </div>
                </div>
                <div className="flex justify-end gap-3 pt-4">
                  <button type="button" onClick={() => { setShowTaskForm(false); setEditingTask(null) }} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800">Annuler</button>
                  <button type="submit" className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium">
                    <Save className="w-4 h-4" />
                    {editingTask ? 'Modifier' : 'Créer'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Document Form Modal */}
        {showDocForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => { setShowDocForm(false); setEditingDoc(null) }}>
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4 p-6" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold">{editingDoc ? 'Modifier le document' : 'Nouveau document'}</h3>
                <button onClick={() => { setShowDocForm(false); setEditingDoc(null) }} className="p-1 text-gray-400 hover:text-gray-600 rounded">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleSaveDoc} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Titre *</label>
                  <input name="titre" required defaultValue={editingDoc?.titre || ''} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                    <input name="type_document" defaultValue={editingDoc?.type_document || ''} placeholder="rapport, PV, note..." className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Statut</label>
                    <select name="statut" defaultValue={editingDoc?.statut || 'brouillon'} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent">
                      <option value="brouillon">Brouillon</option>
                      <option value="en_revue">En revue</option>
                      <option value="valide">Validé</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Contenu</label>
                  <textarea name="contenu" rows={6} defaultValue={editingDoc?.contenu || ''} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Auteur</label>
                  <input name="auteur" defaultValue={editingDoc?.auteur || ''} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent" />
                </div>
                <div className="flex justify-end gap-3 pt-4">
                  <button type="button" onClick={() => { setShowDocForm(false); setEditingDoc(null) }} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800">Annuler</button>
                  <button type="submit" className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium">
                    <Save className="w-4 h-4" />
                    {editingDoc ? 'Modifier' : 'Créer'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

export default App
