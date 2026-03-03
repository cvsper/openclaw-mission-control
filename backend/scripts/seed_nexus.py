"""Seed the Nexus database with the agent family, boards, and org."""

from __future__ import annotations

import asyncio
import sys
from pathlib import Path

BACKEND_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BACKEND_ROOT))


AGENTS = [
    {"name": "Dommo", "role": "Architect", "status": "online"},
    {"name": "Zim", "role": "Orchestrator", "status": "online"},
    {"name": "Zion", "role": "Research", "status": "idle"},
    {"name": "Banksy", "role": "Creative", "status": "idle"},
    {"name": "Vivi", "role": "Operations", "status": "idle"},
    {"name": "Neo", "role": "Security", "status": "idle"},
]

BOARDS = [
    {"name": "Umuve Platform", "slug": "umuve-platform", "objective": "Launch and grow the Umuve marketplace platform"},
    {"name": "Infrastructure", "slug": "infrastructure", "objective": "Mac Mini services, Docker, networking, CI/CD"},
    {"name": "AI Systems", "slug": "ai-systems", "objective": "ZimMemory, Cortex, skillctl, agent intelligence"},
    {"name": "Mobile Apps", "slug": "mobile-apps", "objective": "iOS apps, VisionClaw, Quest builds"},
    {"name": "Marketing", "slug": "marketing", "objective": "SEO, content, outreach, growth hacking"},
    {"name": "Agent Ops", "slug": "agent-ops", "objective": "Agent coordination, heartbeats, messaging, dashboards"},
]


async def run() -> None:
    from sqlmodel import select

    from app.db.session import async_session_maker, init_db
    from app.models.agents import Agent
    from app.models.board_groups import BoardGroup
    from app.models.boards import Board
    from app.models.gateways import Gateway
    from app.models.organization_members import OrganizationMember
    from app.models.organizations import Organization
    from app.models.users import User

    await init_db()
    async with async_session_maker() as session:
        # --- Organization (idempotent) ---
        result = await session.exec(select(Organization).where(Organization.name == "Nexus"))
        org = result.first()
        if not org:
            org = Organization(name="Nexus")
            session.add(org)
            await session.commit()
            await session.refresh(org)
            print(f"Created org: {org.name} ({org.id})")
        else:
            print(f"Org exists: {org.name} ({org.id})")

        # --- Ensure local user is member ---
        result = await session.exec(select(User).where(User.clerk_user_id == "local-auth-user"))
        local_user = result.first()
        if local_user:
            result = await session.exec(
                select(OrganizationMember).where(
                    OrganizationMember.organization_id == org.id,
                    OrganizationMember.user_id == local_user.id,
                )
            )
            if not result.first():
                member = OrganizationMember(
                    organization_id=org.id,
                    user_id=local_user.id,
                    role="admin",
                    all_boards_read=True,
                    all_boards_write=True,
                )
                session.add(member)
                await session.commit()
                print(f"Added local user to org as admin")

            # Set active org
            if local_user.active_organization_id != org.id:
                local_user.active_organization_id = org.id
                session.add(local_user)
                await session.commit()
                print("Set active org for local user")

        # --- Gateway (idempotent) ---
        result = await session.exec(select(Gateway).where(Gateway.name == "mac-mini-gateway"))
        gw = result.first()
        if not gw:
            gw = Gateway(
                organization_id=org.id,
                name="mac-mini-gateway",
                url="http://10.0.0.209:18789",
                workspace_root="/Users/sevs/services",
            )
            session.add(gw)
            await session.commit()
            await session.refresh(gw)
            print(f"Created gateway: {gw.name} ({gw.id})")
        else:
            print(f"Gateway exists: {gw.name} ({gw.id})")

        # --- Board Group (idempotent) ---
        result = await session.exec(select(BoardGroup).where(BoardGroup.slug == "all-projects"))
        bg = result.first()
        if not bg:
            bg = BoardGroup(
                organization_id=org.id,
                name="All Projects",
                slug="all-projects",
                description="All Nexus project boards",
            )
            session.add(bg)
            await session.commit()
            await session.refresh(bg)
            print(f"Created board group: {bg.name} ({bg.id})")
        else:
            print(f"Board group exists: {bg.name} ({bg.id})")

        # --- Boards (idempotent) ---
        board_map = {}
        for board_def in BOARDS:
            result = await session.exec(select(Board).where(Board.slug == board_def["slug"]))
            board = result.first()
            if not board:
                board = Board(
                    organization_id=org.id,
                    name=board_def["name"],
                    slug=board_def["slug"],
                    board_type="goal",
                    objective=board_def["objective"],
                    gateway_id=gw.id,
                    board_group_id=bg.id,
                    max_agents=6,
                )
                session.add(board)
                await session.commit()
                await session.refresh(board)
                print(f"Created board: {board.name} ({board.id})")
            else:
                print(f"Board exists: {board.name} ({board.id})")
            board_map[board_def["slug"]] = board

        # --- Agents (idempotent) ---
        # Assign agents to the agent-ops board by default
        default_board = board_map.get("agent-ops")
        for agent_def in AGENTS:
            result = await session.exec(select(Agent).where(Agent.name == agent_def["name"]))
            agent = result.first()
            if not agent:
                agent = Agent(
                    gateway_id=gw.id,
                    board_id=default_board.id if default_board else None,
                    name=agent_def["name"],
                    status=agent_def["status"],
                    is_board_lead=(agent_def["name"] == "Zim"),
                    identity_profile={
                        "role": agent_def["role"],
                        "family": "nexus",
                    },
                )
                session.add(agent)
                await session.commit()
                await session.refresh(agent)
                print(f"Created agent: {agent.name} ({agent.id})")
            else:
                print(f"Agent exists: {agent.name} ({agent.id})")

        print("\nSeed complete!")


if __name__ == "__main__":
    asyncio.run(run())
