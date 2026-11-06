import { Navigate, createHashRouter } from 'react-router-dom';
import AppLayout from '@/layouts/AppLayout';
import Dashboard from '@/features/dashboard/Dashboard';
import Assets from '@/features/assets/Assets';
import AssetDetail from '@/features/assets/AssetDetail';
import Upload from '@/features/upload/Upload';
import Tools from '@/features/tools/Tools';
import Asr from '@/features/tools/Asr';
import SubtitleWorkshop from '@/features/tools/SubtitleWorkshop';
import Enhance from '@/features/tools/Enhance';
import AudioTool from '@/features/tools/AudioTool';
import Tts from '@/features/tools/Tts';
import Translate from '@/features/tools/Translate';
import Review from '@/features/tools/Review';
import Insight from '@/features/tools/Insight';
import Pipelines from '@/features/pipelines/Pipelines';
import PipelineCanvas from '@/features/pipelines/PipelineCanvas';
import PipelineRuns from '@/features/pipelines/PipelineRuns';
import Tasks from '@/features/tasks/Tasks';
import TaskDetail from '@/features/tasks/TaskDetail';
import Templates from '@/features/templates/Templates';
import Usage from '@/features/usage/Usage';
import Developer from '@/features/developer/Developer';
import Team from '@/features/team/Team';
import Settings from '@/features/settings/Settings';
import Audit from '@/features/audit/Audit';

export const router = createHashRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true, element: <Dashboard /> },
      { path: 'assets', element: <Assets /> },
      { path: 'assets/:assetId', element: <AssetDetail /> },
      { path: 'upload', element: <Upload /> },
      { path: 'tools', element: <Tools /> },
      { path: 'tools/asr', element: <Asr /> },
      { path: 'tools/subtitle/:assetId', element: <SubtitleWorkshop /> },
      { path: 'tools/enhance', element: <Enhance /> },
      { path: 'tools/audio', element: <AudioTool /> },
      { path: 'tools/tts', element: <Tts /> },
      { path: 'tools/translate', element: <Translate /> },
      { path: 'tools/review', element: <Review /> },
      { path: 'tools/insight', element: <Insight /> },
      { path: 'pipelines', element: <Pipelines /> },
      { path: 'pipelines/:pipelineId', element: <PipelineCanvas /> },
      { path: 'pipelines/:pipelineId/runs', element: <PipelineRuns /> },
      { path: 'tasks', element: <Tasks /> },
      { path: 'tasks/:taskId', element: <TaskDetail /> },
      { path: 'templates', element: <Templates /> },
      { path: 'usage', element: <Usage /> },
      { path: 'developer', element: <Developer /> },
      { path: 'team', element: <Team /> },
      { path: 'settings', element: <Settings /> },
      { path: 'audit', element: <Audit /> },
      { path: '*', element: <Navigate to="/" replace /> },
    ],
  },
]);
