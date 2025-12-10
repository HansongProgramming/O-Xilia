type Props = {
    context: { visible: boolean; x: number; y: number; type: "category" | "sidebar" | null; categoryId: string | null };
    onClose: () => void;
    createPage: (categoryId: string) => void;
    createCategory: () => void;
    updateCategoryName: (categoryId: string, name: string) => void;
    deleteCategory: (categoryId: string) => void;
    setCategoryFolder: (categoryId?: string) => void;
};


export function ContextMenu({ context, onClose, createPage, createCategory, updateCategoryName, deleteCategory, setCategoryFolder }: Props) {
    if (!context.visible) return null;


    if (context.type === "category") {
        return (
            <div className="context-menu" style={{ position: "fixed", top: context.y, left: context.x, zIndex: 9999 }} onClick={(e) => e.stopPropagation()}>
                <button onClick={() => { if (context.categoryId) createPage(context.categoryId); onClose(); }}>➕ Add Page</button>
                <button onClick={() => {
                    const newName = prompt("Rename category:");
                    if (newName && context.categoryId) updateCategoryName(context.categoryId, newName);
                    onClose();
                }}>✏️ Rename</button>
                <button onClick={() => { if (context.categoryId) deleteCategory(context.categoryId); onClose(); }}>❌ Delete</button>
                <button onClick={() => { if (context.categoryId) setCategoryFolder(context.categoryId); onClose(); }}>📁 Choose Folder...</button>
            </div>
        );
    }


    // sidebar menu
    return (
        <div className="context-menu" style={{ position: "fixed", top: context.y, left: context.x, zIndex: 9999 }} onClick={(e) => e.stopPropagation()}>
            <button onClick={() => { createCategory(); onClose(); }}>➕ New Category</button>
        </div>
    );
}