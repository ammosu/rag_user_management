import React from 'react';
import { NavLink } from 'react-router-dom';
import './Sidebar.css';

interface Workspace {
  id: string;
  name: string;
  description: string;
}

interface SidebarProps {
  workspaces: Workspace[];
  isLoading: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ workspaces, isLoading }) => {
  return (
    <aside className="sidebar">
      <nav>
        <ul>
          <li>
            <NavLink 
              to="/dashboard" 
              className={({ isActive }) => isActive ? 'active' : ''}
              end
            >
              RAG 查詢
            </NavLink>
          </li>
          
          <li className="nav-section">
            <h3>知識庫</h3>
            {isLoading ? (
              <p>載入中...</p>
            ) : workspaces.length === 0 ? (
              <p>無可用知識庫</p>
            ) : (
              <ul>
                {workspaces.map((workspace) => (
                  <li key={workspace.id}>
                    <NavLink
                      to={`/dashboard/workspace/${workspace.id}`}
                      className={({ isActive }) => isActive ? 'active' : ''}
                    >
                      {workspace.name}
                    </NavLink>
                  </li>
                ))}
              </ul>
            )}
          </li>
        </ul>
      </nav>
    </aside>
  );
};

export default Sidebar;
