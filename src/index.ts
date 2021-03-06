import {
  JupyterLab,
  JupyterLabPlugin,
} from '@jupyterlab/application';

import {
  IFileBrowserFactory
} from '@jupyterlab/filebrowser';

import { INotebookTracker } from '@jupyterlab/notebook';


import {
  retrieveImageFromClipboardAsBlob,
} from './clipboard'

import {
  imageEditor,
} from './image-editor'

import {
  openPasteAsDialog,
  openConfirmOverwriteDialog,
} from './dialogs';



const plugin: JupyterLabPlugin<void> = {
  id: 'jupyterlab-clipboard',
  requires: [
    IFileBrowserFactory,
    INotebookTracker,
  ],
  autoStart: true,
  activate: activateJupyterlabClipboard,
};

export default plugin;

import {
  PathExt,
} from '@jupyterlab/coreutils';

function activateJupyterlabClipboard(
  app: JupyterLab,
  browserFactory: IFileBrowserFactory,
  notebooks: INotebookTracker,
) {
  const browser = browserFactory.defaultBrowser;

  const {
    saveImageAs,
    insertInCell,
    createMarkdownImageTag,
    fileAlreadyExists,
  } = imageEditor(app, notebooks);

  window.addEventListener("paste", async function(e: ClipboardEvent) {
    const clipboardImage = retrieveImageFromClipboardAsBlob(e).find(Boolean);
    if(!clipboardImage) return;

    const cwd = browser.model.path;

    const defaultPath = PathExt.resolve(cwd, clipboardImage.name);
    const path = await openPasteAsDialog(defaultPath)
    const alreadyExists = await fileAlreadyExists(path)

    if(alreadyExists) {
      const overwrite = await openConfirmOverwriteDialog(path)
      if(!overwrite) return;
    }

    if(!path) return;

    await saveImageAs(cwd, path, clipboardImage);
    const relativePath = PathExt.relative(cwd, path);
    const content = createMarkdownImageTag(relativePath)
    insertInCell(content);
  }, false);
}

