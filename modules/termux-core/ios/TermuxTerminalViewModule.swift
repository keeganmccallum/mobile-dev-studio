import ExpoModulesCore
import UIKit

public class TermuxTerminalViewModule: Module {
    public func definition() -> ModuleDefinition {
        Name("TermuxTerminalView")
        
        View(TermuxTerminalView.self) {
            Prop("command") { (view: TermuxTerminalView, command: String) in
                view.setCommand(command)
            }
            
            Prop("workingDirectory") { (view: TermuxTerminalView, workingDirectory: String) in
                view.setWorkingDirectory(workingDirectory)
            }
            
            Prop("environment") { (view: TermuxTerminalView, environment: [String: String]) in
                view.setEnvironment(environment)
            }
            
            Events("onSessionOutput", "onSessionExit")
        }
    }
}

public class TermuxTerminalView: ExpoView {
    private var command: String = "/bin/sh"
    private var workingDirectory: String = "/"
    private var environment: [String: String] = [:]
    
    required init(appContext: AppContext? = nil) {
        super.init(appContext: appContext)
        setupView()
    }
    
    private func setupView() {
        let label = UILabel()
        label.text = "🐧 Termux Terminal\n\nNot available on iOS\n(Android only)"
        label.textColor = UIColor.white
        label.backgroundColor = UIColor.black
        label.font = UIFont.monospacedSystemFont(ofSize: 14, weight: .regular)
        label.numberOfLines = 0
        label.textAlignment = .left
        
        addSubview(label)
        label.translatesAutoresizingMaskIntoConstraints = false
        NSLayoutConstraint.activate([
            label.topAnchor.constraint(equalTo: topAnchor, constant: 16),
            label.leadingAnchor.constraint(equalTo: leadingAnchor, constant: 16),
            label.trailingAnchor.constraint(equalTo: trailingAnchor, constant: -16),
            label.bottomAnchor.constraint(equalTo: bottomAnchor, constant: -16)
        ])
    }
    
    func setCommand(_ command: String) {
        self.command = command
    }
    
    func setWorkingDirectory(_ workingDirectory: String) {
        self.workingDirectory = workingDirectory
    }
    
    func setEnvironment(_ environment: [String: String]) {
        self.environment = environment
    }
}