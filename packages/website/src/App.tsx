import { Add, Close, Menu, Subtract } from '@carbon/icons-react';
import { Header, HeaderGlobalAction, HeaderGlobalBar } from 'carbon-components-react';
import Trigger from 'rc-trigger';
import { useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Redirect, Router, Switch, Route } from 'react-router-dom';
import { GapiErrorDisplay } from './components';
import { RenderStackProvider } from './context/RenderStack';
import useLoadDriveFiles from './hooks/useLoadDriveFiles';
import {
  HeaderExtraActions,
  HeaderSearch,
  HeaderTitle,
  Content,
  HeaderUserAction,
  Sider,
  HeaderUserMenu,
} from './layout';
import responsiveStyle from './layout/responsive.module.scss';
import Drives from './pages/Location/Drives';
import Page, { HomePage } from './pages/Page';
import { SearchResult, SearchTag } from './pages/Search';
import SearchAllTags from './pages/Search/AllTags';
import Settings from './pages/Settings';
import { selectMapIdToFile } from './reduxSlices/files';
import {
  collapseAll,
  expand,
  selectSidebarOpen,
  closeSidebar,
  openSidebar,
} from './reduxSlices/siderTree';
import { history, isTouchScreen } from './utils';

function DriveFilesLoader({ children }) {
  useLoadDriveFiles();
  return <>{children}</>;
}

function App(props: { isSignedIn: boolean }) {
  const dispatch = useDispatch();
  const sidebarOpen = useSelector(selectSidebarOpen);
  const mapIdToFile = useSelector(selectMapIdToFile);

  const handleOpenTOC = () => dispatch(openSidebar());
  const handleCloseTOC = () => dispatch(closeSidebar());
  const handleTreeExpand = useCallback(() => {
    let ids: string[] = [];
    for (let id in mapIdToFile) {
      ids.push(id);
    }
    dispatch(expand({ arg: ids, mapIdToFile }));
  }, [mapIdToFile, dispatch]);
  const handleTreeCollapse = useCallback(() => dispatch(collapseAll()), [dispatch]);

  return (
      <Router history={history}>
        <DriveFilesLoader>
          <Header aria-label="global actions">
            {!sidebarOpen && (
              <HeaderGlobalAction key="open" aria-label="Open TOC" onClick={handleOpenTOC}>
                <Menu size={20} />
              </HeaderGlobalAction>
            )}
            {sidebarOpen && [
              <HeaderGlobalAction key="close" aria-label="Close TOC" onClick={handleCloseTOC}>
                <Close size={20} />
              </HeaderGlobalAction>,
              <HeaderGlobalAction
                key="expand"
                aria-label="Expand All"
                onClick={handleTreeExpand}
                className={responsiveStyle.hideInPhone}
              >
                <Add size={20} />
              </HeaderGlobalAction>,
              <HeaderGlobalAction
                key="collapse"
                aria-label="Collapse All"
                onClick={handleTreeCollapse}
                className={responsiveStyle.hideInPhone}
              >
                <Subtract size={20} />
              </HeaderGlobalAction>,
            ]}
            <HeaderTitle />
            <HeaderExtraActions />
            <HeaderGlobalBar className={responsiveStyle.hideInPhone}>
              <HeaderSearch />
              <Trigger
                popupAlign={{
                  points: ['tr', 'br'],
                }}
                mouseLeaveDelay={0.2}
                zIndex={10000}
                action="hover"
                popup={<HeaderUserMenu />}
                popupTransitionName="slide-up"
              >
                <div>
                  <HeaderUserAction />
                </div>
              </Trigger>
            </HeaderGlobalBar>
            <Sider isExpanded={sidebarOpen} />
          </Header>
          <Content isExpanded={sidebarOpen}>
            {!props.isSignedIn ? (
              <GapiErrorDisplay subtitle=" " error={new Error('Please sign in')} />
            ) : (
              <RenderStackProvider>
                <Switch>
                  {/* translate lazy copy & paste from Google Docs */}
                  <Redirect to="/view/:id" from="/document/d/:id" />
                  <Redirect to="/view/:id" from="/document/d/:id/*" />
                  <Redirect to="/view/:id" from="/https\://:domain/document/d/:id" />
                  <Redirect to="/view/:id" from="/https\://:domain/document/d/:id/*" />

                  <Route exact path="/">
                    <HomePage />
                  </Route>
                  <Route exact path="/view/:id/view">
                    <Page docMode="view" />
                  </Route>
                  <Route exact path="/view/:id/settings">
                    <Settings />
                  </Route>
                  {isTouchScreen
                    ? [
                        <Redirect to="/view/:id/view" from="/view/:id/preview" key="preview" />,
                        <Redirect to="/view/:id/view" from="/view/:id/edit" key="edit" />,
                        <Redirect to="/view/:id/view" from="/view/:id/versions" key="versions" />,
                      ]
                    : [
                        <Route path="/view/:id/edit" key="edit">
                          <Page docMode="edit" />
                        </Route>,
                        <Route path="/view/:id/preview" key="preview">
                          <Page docMode="preview" />
                        </Route>,
                        <Route exact path="/view/:id/versions" key="versions">
                          <Page docMode="edit" versions={true} />
                        </Route>,
                      ]}
                  <Route path="/view/:id">
                    <Page />
                  </Route>
                  <Route exact path="/search/keyword/:keyword">
                    <SearchResult />
                  </Route>
                  <Route exact path="/search/tag">
                    <SearchAllTags />
                  </Route>
                  <Route exact path="/search/tag/:tag">
                    <SearchTag />
                  </Route>
                  <Route path="/n/:slug/:id">
                    <Page />
                  </Route>
                  <Route path="/drives">
                    <Drives />
                  </Route>
                </Switch>
              </RenderStackProvider>
            )}
          </Content>
        </DriveFilesLoader>
      </Router>
  );
}

export default App;
