export default function ManualPanel() {
  return (
    <div className="border border-purple-500/60 bg-black p-3 md:p-5 mb-4">
      <div className="flex items-center gap-2 mb-3">
        <svg className="w-4 h-4 text-purple-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <h2 className="text-white text-xs font-bold tracking-widest uppercase">
          Nexus Hacking Manual : Security Override
        </h2>
      </div>

      <p className="text-white/60 text-xs mb-4">
        <span className="text-white font-semibold">OBJECTIVE:</span>{' '}
        Override locked terminals by analyzing logs and assembling the correct key.
      </p>

      <div className="space-y-4 text-xs">
        {/* Easy */}
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-2 h-2 rounded-full bg-green-400 shrink-0" />
            <span className="text-green-400 font-bold tracking-wider">EASY LEVEL DECRYPTION:</span>
          </div>
          <ul className="text-white/60 space-y-0.5 ml-4">
            <li>• Look for specific badge numbers, sector names, or override protocols in clear text.</li>
          </ul>
        </div>

        {/* Medium */}
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
            <span className="text-amber-400 font-bold tracking-wider">MEDIUM LEVEL DECRYPTION:</span>
          </div>
          <ul className="text-white/60 space-y-1 ml-4">
            <li>• <span className="text-white">Protocols:</span> Strip hyphen characters from system codes (e.g. R-42 becomes R42)</li>
            <li>• <span className="text-white">Project Days:</span> Combine project names with dates sequentially (e.g. OMEGA + Day 15 = OMEGA15)</li>
            <li>• <span className="text-white">Reverse Logs:</span> Reverse failed entry strings (e.g. 1234 reversed is 4321)</li>
          </ul>
        </div>

        {/* Hard */}
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-2 h-2 rounded-full bg-red-400 shrink-0" />
            <span className="text-red-400 font-bold tracking-wider">HARD LEVEL DECRYPTION:</span>
          </div>
          <ul className="text-white/60 space-y-1 ml-4">
            <li>• <span className="text-white">Science Initials:</span> Combine all-caps author initials with years (e.g. Dr. Elena VOSS in 2084 = EV2084)</li>
            <li>• <span className="text-white">Agent Extraction:</span> Combine agent codename with coordinate values (e.g. RAVEN + 47N = RAVEN47)</li>
            <li>• <span className="text-white">Incremental Keys:</span> Increment numbers inside expired passwords (e.g. NEXUS01 incremented by 22 = NEXUS23)</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
