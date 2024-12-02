import { useApp } from '@/hooks/useApp'
import { Skeleton } from '@/components/ui/Skelton'

const AppList = () => {
  const { apps, selectedAppIndex, setSelectedAppIndex } = useApp()

  const onSelect = (index: number) => {
    setSelectedAppIndex(index)
  }

  if (apps.length === 0) {
    return <Skeleton className="w-20 h-8" />
  }

  return (
    <div className="flex items-center space-x-2">
      {apps.map((app, index) => (
        <div
          key={app.name}
          className={`${selectedAppIndex === index ? 'bg-white/10' : ''} py-2 px-3 rounded-md cursor-pointer`}
          onClick={() => onSelect(index)}
        >
          {app.icon}
        </div>
      ))}
    </div>
  )
}

export { AppList }
