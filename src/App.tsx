import "@blocknote/mantine/style.css";
import "@blocknote/core/fonts/inter.css";
import "@blocknote/react/style.css";
import "./index.css";

import { useState } from "react";
import type { Category } from "./types";

import { BlockNoteView } from "@blocknote/mantine";
import { SuggestionMenuController } from "@blocknote/react";
import { Icon } from "@iconify/react";

import Sidebar from "./components/Sidebar";
import SidebarCalendar from "./components/SidebarCalendar";
import ChannelPage from "./components/Channelpage";

import type { ContextMenuState, IconPickerState } from "./types";

import { useLoadData } from "./hooks/useLoadData";
import { useEditor } from "./hooks/useEditor";
import { useEditorChange } from "./hooks/useEditorChange";
import { useAutoSave } from "./hooks/useAutoSave";
import { useOutsideClick } from "./hooks/useOutsideClick";
import { useActions } from "./hooks/useActions";

import { getCustomSlashMenuItems } from "./editor/customSlashMenu";

export default function App() {
  const {
    categories,
    setCategories,
    activePageId,
    setActivePageId,
    isLoading,
  } = useLoadData();

  const [contextMenu, setContextMenu] =
    useState<ContextMenuState>({
      visible: false,
      x: 0,
      y: 0,
      type: null,
      categoryId: null,
    });

  const [iconPicker, setIconPicker] =
    useState<IconPickerState>({
      visible: false,
      x: 0,
      y: 0,
      forType: null,
      id: null,
    });

  /** CATEGORY REORDER */
  const reorderCategories = (newCategories: Category[]) => {
    setCategories(newCategories);
  };

  /** PAGE REORDER (WITHIN CATEGORY) */
  const reorderPages = (
    categoryId: string,
    newPages: Category["pages"]
  ) => {
    setCategories((prev) =>
      prev.map((cat) =>
        cat.id === categoryId
          ? { ...cat, pages: newPages }
          : cat
      )
    );
  };

  const editor = useEditor(
    categories,
    activePageId,
    isLoading
  );

  useEditorChange(
    editor,
    categories,
    setCategories,
    activePageId,
    isLoading
  );

  useAutoSave(categories, isLoading);
  useOutsideClick(setContextMenu, setIconPicker);

  const actions = useActions(
    categories,
    setCategories,
    activePageId,
    setActivePageId,
    setContextMenu,
    iconPicker,
    setIconPicker
  );

  if (isLoading) {
    return (
      <div className="loading-screen">
        <h2>Loading...</h2>
      </div>
    );
  }

  const activePage = categories
    .flatMap((c) => c.pages || [])
    .find((p) => p?.id === activePageId);

  return (
    <div className="app">
      <div className="side-container">
        <Sidebar
          categories={categories}
          activePageId={activePageId}
          contextMenu={contextMenu}
          iconPicker={iconPicker}
          openIconPicker={actions.openIconPicker}
          setContextMenu={setContextMenu}
          createCategory={actions.createCategory}
          createPage={actions.createPage}
          deleteCategory={actions.deleteCategory}
          updateCategoryName={actions.updateCategoryName}
          toggleCategoryExpanded={actions.toggleCategoryExpanded}
          deletePage={actions.deletePage}
          setActivePageId={setActivePageId}
          setCategoryFolder={actions.setCategoryFolder}
          onIconSelect={actions.onIconSelect}
          reorderCategories={reorderCategories}
          reorderPages={reorderPages}
        />
        <SidebarCalendar />
      </div>

      <main className="main-content">
        {activePage ? (
          activePage.type === "channel" ? (
            editor ? (
              <ChannelPage channelId={activePage.id} />
            ) : null
          ) : (
            <>
              <div className="page-header">
                <button
                  className="icon-button header-icon"
                  onClick={(ev) =>
                    actions.openIconPicker(
                      ev,
                      "page",
                      activePage.id
                    )
                  }
                >
                  <Icon
                    icon={`ic:${activePage.icon}`}
                    width="24"
                    height="24"
                  />
                </button>

                <input
                  className="title-input"
                  value={activePage.title}
                  onChange={(e) =>
                    actions.updatePageTitle(
                      e.target.value
                    )
                  }
                />
              </div>

              {editor && (
                <div className="editor-container">
                  <BlockNoteView
                    editor={editor}
                    slashMenu={false}
                  >
                    <SuggestionMenuController
                      triggerCharacter="/"
                      getItems={async () =>
                        getCustomSlashMenuItems(
                          editor
                        )
                      }
                    />
                  </BlockNoteView>
                </div>
              )}
            </>
          )
        ) : (
          <div className="no-page-selected">
            <h3>No page selected</h3>
            <p>Create or choose a page to begin</p>
          </div>
        )}
      </main>
    </div>
  );
}
