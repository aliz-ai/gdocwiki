import {
  Add,
  ArrowUp,
  ChevronDown,
  ChevronRight,
  DocumentView,
  Edit,
  Launch,
  Link,
  List,
  Maximize,
  Minimize,
  OverflowMenuHorizontal,
  View,
  Settings,
  Star,
  StarFilled,
  TrashCan,
  WatsonHealthStackedMove,
} from '@carbon/icons-react';
import { Icon } from '@iconify/react';
import googleDrive from '@iconify-icons/logos/google-drive';
import fileEdit from '@iconify-icons/mdi/file-edit';
import { registerIcons as register } from 'office-ui-fabric-react';

export function registerIcons() {
  register({
    icons: {
      ArrowUp: <ArrowUp />,
      More: <OverflowMenuHorizontal />,
      ChevronRight: <ChevronRight />,
      ChevronDown: <ChevronDown />,
      DocumentView: <DocumentView />,
      Launch: <Launch />,
      Link: <Link />,
      List: <List />,
      Edit: <Edit />,
      Star: <Star />,
      StarFilled: <StarFilled />,
      Trash: <TrashCan />,
      View: <View />,
      Settings: <Settings />,
      Add: <Add/>,
      StackedMove: <WatsonHealthStackedMove />,
      ColorGoogleDrive: <Icon icon={googleDrive} />,
      MdiFileEdit: <Icon icon={fileEdit} />,
      Maximize: <Maximize />,
      Minimize: <Minimize />,
    },
  });
}
