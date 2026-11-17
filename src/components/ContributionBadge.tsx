import { GitPullRequest } from 'lucide-react'
export function ContributionBadge({ count, compact = false }: { count: number; compact?: boolean }) {
  return <span className={compact ? 'contribution-badge compact' : 'contribution-badge'} title={`${count} contribuição(ões) com trabalho efetivo registrado`}><GitPullRequest size={compact ? 13 : 16} />{count} {compact ? '' : count === 1 ? 'contribuição' : 'contribuições'}</span>
}
