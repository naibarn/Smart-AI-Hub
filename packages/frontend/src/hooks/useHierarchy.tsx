import { useState, useEffect } from 'react';

interface HierarchyMember {
  id: string;
  name: string;
  email: string;
  tier: string;
  points: number;
  credits: number;
  isBlocked: boolean;
  parentId?: string;
  signupDate: string;
}

interface HierarchyNode {
  id: string;
  name: string;
  email: string;
  tier: string;
  points: number;
  credits: number;
  isBlocked: boolean;
  children?: HierarchyNode[];
}

interface HierarchyData {
  members: HierarchyMember[];
  tree: HierarchyNode[];
  totalMembers: number;
  totalPoints: number;
  totalCredits: number;
}

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const useHierarchy = () => {
  const [data, setData] = useState<HierarchyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const buildHierarchyTree = (members: HierarchyMember[]): HierarchyNode[] => {
    const memberMap = new Map<string, HierarchyNode>();
    const rootNodes: HierarchyNode[] = [];

    // First pass: create all nodes
    members.forEach((member) => {
      const node: HierarchyNode = {
        id: member.id,
        name: member.name,
        email: member.email,
        tier: member.tier,
        points: member.points,
        credits: member.credits,
        isBlocked: member.isBlocked,
        children: [],
      };
      memberMap.set(member.id, node);
    });

    // Second pass: build the tree structure
    members.forEach((member) => {
      const node = memberMap.get(member.id);
      if (node) {
        if (member.parentId) {
          const parent = memberMap.get(member.parentId);
          if (parent) {
            parent.children = parent.children || [];
            parent.children.push(node);
          }
        } else {
          // This is a root node
          rootNodes.push(node);
        }
      }
    });

    return rootNodes;
  };

  const fetchHierarchyData = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const [membersRes, treeRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/v1/hierarchy/members`, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }),
        fetch(`${API_BASE_URL}/api/v1/hierarchy/tree`, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }),
      ]);

      if (!membersRes.ok || !treeRes.ok) {
        throw new Error(`HTTP error! status: ${membersRes.status} / ${treeRes.status}`);
      }

      const membersResult = await membersRes.json();
      const treeResult = await treeRes.json();

      if (membersResult.success && treeResult.success) {
        const members = membersResult.data?.members || [];
        const treeData = treeResult.data?.tree || [];

        // Calculate totals
        const totalMembers = members.length;
        const totalPoints = members.reduce(
          (sum: number, member: HierarchyMember) => sum + member.points,
          0
        );
        const totalCredits = members.reduce(
          (sum: number, member: HierarchyMember) => sum + member.credits,
          0
        );

        // Build tree from members if tree data is not provided
        const builtTree = treeData.length > 0 ? treeData : buildHierarchyTree(members);

        setData({
          members,
          tree: builtTree,
          totalMembers,
          totalPoints,
          totalCredits,
        });
      }
    } catch (err) {
      setError(err as Error);
      console.error('Failed to fetch hierarchy data:', err);
    } finally {
      setLoading(false);
    }
  };

  const searchMembers = async (query: string): Promise<HierarchyMember[]> => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(
        `${API_BASE_URL}/api/v1/hierarchy/search?q=${encodeURIComponent(query)}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result.success ? result.data?.members || [] : [];
    } catch (err) {
      console.error('Failed to search members:', err);
      return [];
    }
  };

  const getMemberDetails = async (memberId: string): Promise<HierarchyMember | null> => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`${API_BASE_URL}/api/v1/hierarchy/members/${memberId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result.success ? result.data?.member || null : null;
    } catch (err) {
      console.error('Failed to get member details:', err);
      return null;
    }
  };

  useEffect(() => {
    fetchHierarchyData();
  }, []);

  return {
    data,
    loading,
    error,
    refetch: fetchHierarchyData,
    searchMembers,
    getMemberDetails,
  };
};
