import React from 'react';
import { RouteGuard } from '../../components/guards/RouteGuard';
import { MemberList } from '../../components/MemberList';

export const MembersPage: React.FC = () => {
  return (
    <RouteGuard allowedTiers={['administrator', 'agency', 'organization', 'admin']}>
      <div className="members-page">
        <h1>Members</h1>
        <MemberList />
      </div>
    </RouteGuard>
  );
};
