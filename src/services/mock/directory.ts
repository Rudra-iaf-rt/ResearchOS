import type { Person, ResearchDatabase, UserProfile } from "@/types";

export function userToPerson(user: UserProfile): Person {
  return {
    id: user.id,
    name: user.name,
    initials: user.initials,
    role: user.role,
    color: user.avatarColor,
  };
}

/**
 * Build a workspace-wide people directory from records that already reference
 * real actors. Prevents pages from importing mock person arrays directly.
 */
export function buildPersonDirectory(db: ResearchDatabase): Map<string, Person> {
  const directory = new Map<string, Person>();
  const add = (person: Person | null | undefined) => {
    if (person && !directory.has(person.id)) directory.set(person.id, person);
  };

  add(userToPerson(db.user));
  db.projects.forEach((project) => {
    add(project.owner);
    project.members.forEach(add);
  });
  db.tasks.forEach((task) => add(task.assignee));
  db.activity.forEach((event) => add(event.actor));

  return directory;
}
