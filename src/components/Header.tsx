import { Trash2 } from 'lucide-react'
import { Account } from 'starknet'
import Avatar from './Avatar'
import { truncateAddress } from '@/utils'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useDojo } from '@/libs/dojo/useDojo'
import { useMemo } from 'react'
import Spinner from './Spinner'

const Header = ({ account }: { account: Account }) => {
  const {
    account: { select, list, create, remove, isDeploying },
  } = useDojo()

  const otherBurnerAccounts = useMemo(
    () => list().filter((a) => a.address !== account.address),
    [account, list],
  )

  const onSelect = (e: React.MouseEvent<HTMLDivElement>, address: string) => {
    e.preventDefault()
    select(address)
  }

  const onCreate = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault()
    create()
  }

  const onDelete = (e: React.MouseEvent<SVGSVGElement>, address: string) => {
    e.preventDefault()
    remove(address)
  }

  return (
    <header className='bg-primary h-[50px] w-full flex items-center justify-between p-4'>
      <h1 className='text-white text-lg font-bold'>
        <img src='logo.png' alt='PixeLAW' className='object-contain h-10' />
      </h1>
      <DropdownMenu>
        <DropdownMenuTrigger>
          <div className='flex items-center space-x-4 border-2 border-slate-600 rounded-sm p-1 px-3'>
            <div className='text-white'>{truncateAddress(account.address)}</div>
            <Avatar address={account.address} size={32} />
          </div>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuLabel>Burner Accounts</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {otherBurnerAccounts.map((account) => (
            <DropdownMenuItem
              onClick={(e) => onSelect(e, account.address)}
              key={account.address}
              className='cursor-pointer flex justify-between'
            >
              {truncateAddress(account.address)}
              <Trash2 size={16} color='red' onClick={(e) => onDelete(e, account.address)} />
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={onCreate}>
            {isDeploying ? (
              <div className='flex items-center space-x-2 justify-between'>
                <Spinner color='black' />
                Deploying...
              </div>
            ) : (
              <div className='flex items-center space-x-2'>Create</div>
            )}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  )
}

export { Header }
